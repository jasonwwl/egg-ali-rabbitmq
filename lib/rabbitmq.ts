import { Application } from 'egg';
import { connect, Connection, Channel, ConfirmChannel, Options, ConsumeMessage } from 'amqplib';
import { stringify } from 'querystring';
import { EggAliRabbitMQConfig } from '../config/config.default';
import { join } from 'path';
import { getUsername, getPassword, filterURLSecret } from './util';
import { EventEmitter } from 'events';

export interface IRabbitMQProducerOptions {
  confirmChannel?: boolean;
}

export interface IRabbitMQPublishPayload {
  exchange: string;
  routingKey: string;
  message: any;
  options?: Options.Publish;
}


type ConsumerHandler = (msg: RabbitMQConsumeMsg) => Promise<boolean>

export interface IRabbitMQConsumeOptions {
  consumerName: string;
  queueName: string;
  prefetch?: number;
  options?: Options.Consume;
  handler: ConsumerHandler;
}


export class RabbitMQConsumeMsg {
  // eslint-disable-next-line no-useless-constructor
  constructor(public channel: Channel, protected msg: ConsumeMessage) {
    this.receivedDelayMS = Date.now() - msg.properties.timestamp;
  }

  protected cacheContent: any

  public receivedDelayMS: number

  get content() {
    if (!this.cacheContent) {
      try {
        this.cacheContent = JSON.parse(this.msg.content.toString());
      } catch (e) {
        this.cacheContent = this.msg.content.toString();
      }
    }
    return this.cacheContent;
  }

  get props() {
    return this.msg.properties;
  }

  get fields() {
    return this.msg.fields;
  }

  async ack(allUpTo?: boolean) {
    this.channel.ack(this.msg, allUpTo);
  }

  async nack(requeue?: boolean, allUpTo?: boolean,) {
    this.channel.nack(this.msg, allUpTo, requeue);
  }

}
export class RabbitMQ extends EventEmitter {
  private RECONNECT_INTERVAL_MS = 1000

  private RECREATE_CHANNEL_INTERVAL_MS = 5000

  public connection: Connection | null

  private reconnectTimer: any

  public channelPool: {
    [name: string]: {
      channel: Channel | ConfirmChannel;
      name: string;
      reconnectTimer?: any;
      consumer?: IRabbitMQConsumeOptions;
    };
  } = {}

  forceCloseChannel = false
  forceCloseConnection = false

  public producerChannelType: 'normal' | 'confirm'

  constructor(protected config: EggAliRabbitMQConfig) {
    super();
  }

  async connect(reconnect?: boolean) {
    if (this.forceCloseConnection) {
      return null;
    }
    const config = this.config;
    const username = getUsername(config.accessKeyId, config.instance, config.securityToken);
    const password = getPassword(config.accessKeySecret);
    const queryString = config.options ? `?${stringify(config.options)}` : '';
    const url = `amqp://${username}:${password}@${config.url}/${config.vhost}${queryString}`;
    try {
      this.emit(reconnect ? 'reconnecting' : 'connecting', filterURLSecret(url, [ username, password ]));
      this.connection = await connect(url);
      this.emit('connected', { connection: this.connection, url: filterURLSecret(url, [ username, password ]) });
      this.connection.on('blocked', info => this.emit('blocked', info));
      this.connection.on('unblocked', info => this.emit('unblocked', info));
      this.connection.on('error', err => this.emit('error', err));
      this.connection.once('close', async err => {
        this.emit('close', err);
        this.reconnect();
      });
    } catch (e) {
      if (reconnect !== true) {
        throw e;
      }
      this.reconnect();
    }
  }

  async reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    await this.close();
    this.reconnectTimer = setTimeout(() => {
      this.connect(true);
    }, this.RECONNECT_INTERVAL_MS);
  }

  async close() {
    if (!this.connection) {
      return;
    }
    try {
      await this.connection.close();
    } catch (e) {
      this.emit('close_error', e);
    } finally {
      this.connection = null;
    }
  }

  async createChannel(
    channelName: string,
    options?: {confirm?: boolean; consumerOptions?: IRabbitMQConsumeOptions},
    reCreate?: boolean
  ) {
    if (this.forceCloseChannel) {
      return;
    }
    try {
      if (!this.connection) {
        throw new Error('create channel error: connection is not ready!');
      }
      if (this.channelPool[channelName] && !reCreate) {
        throw new Error(`create channel error: chainel "${channelName}" is already exists!`);
      }
      this.emit(reCreate ? 'ch_reconnecting' : 'ch_connecting', { channelName, options });
      const channel = options && options.confirm ? await this.connection.createConfirmChannel() : await this.connection.createChannel();
      this.emit('ch_connected', { channelName, options });
      channel.once('close', () => {
        this.emit('ch_close', { channelName, options });
        this.recreateChannel(channelName, options);
      });

      channel.on('error', error => {
        this.emit('ch_error', { channelName, options, error });
      });

      channel.on('return', msg => {
        this.emit('ch_return', { channelName, options, msg });
      });

      channel.on('drain', msg => {
        this.emit('ch_drain', { channelName, options, msg });
      });

      this.channelPool[channelName] = {
        channel,
        name: channelName,
        consumer: options && options.consumerOptions,
      };
      return channel;
    } catch (e) {
      if (reCreate) {
        this.recreateChannel(channelName, options);
      }
      throw reCreate;
    }
  }

  async recreateChannel(
    channelName: string,
    options?: {confirm?: boolean; consumerOptions?: IRabbitMQConsumeOptions}
  ) {
    if (!this.channelPool[channelName]) {
      return;
    }
    if (this.channelPool[channelName].reconnectTimer) {
      clearTimeout(this.channelPool[channelName].reconnectTimer);
    }
    await this.closeChannel(this.channelPool[channelName].channel);
    setTimeout(async () => {
      try {
        // await this.createChannel(channelName, options, true);
        if (options && options.consumerOptions) {
          this.subscribeConsumer(options.consumerOptions, true);
        } else {
          await this.createChannel(channelName, options, true);
        }
      } catch (e) {
        console.error(e);
      }
    }, this.RECREATE_CHANNEL_INTERVAL_MS);
  }

  async closeChannel(channel: Channel) {
    try {
      await channel.close();
    } catch (e) {
      console.error(e);
    }
  }

  getChannel(name: string) {
    // return this.channelPool[name];
    if (!this.channelPool[name]) {
      throw new Error(`channel "${name}" is not exists!`);
    }
    return this.channelPool[name];
  }

  async initProducerChannel(confirm?: boolean) {
    await this.createChannel('CORE#PRODUCER', { confirm });
    this.producerChannelType = confirm ? 'confirm' : 'normal';
  }

  getProducerChannel() {
    if (!this.channelPool['CORE#PRODUCER']) {
      throw new Error('producer channel error: channel is not ready!');
    }
    return this.channelPool['CORE#PRODUCER'].channel;
  }

  async publish(payload: IRabbitMQPublishPayload) {
    const channel = this.getProducerChannel();
    const { exchange, routingKey, message, options } = payload;
    const finalOptions: Options.Publish = {
      timestamp: Date.now(),
      ... options,
    };
    return new Promise((resolve, reject) => {
      if (this.producerChannelType === 'confirm') {
        channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), finalOptions, err => {
          if (err) {
            reject(err);
            return null;
          }
          resolve(true);
        });
      } else {
        const res = channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), finalOptions);
        if (res) {
          resolve(true);
        } else {
          reject(new Error('publish result return false'));
        }
      }
    });
  }

  async subscribeConsumer(payload: IRabbitMQConsumeOptions, reSub?: boolean) {
    const channel = await this.createChannel(payload.consumerName, { confirm: false, consumerOptions: payload }, reSub);
    if (channel) {
      await channel.prefetch(payload.prefetch || 1);
      await channel.consume(payload.queueName, async msg => {
        if (msg) {
          await payload.handler(new RabbitMQConsumeMsg(channel, msg));
        }
      });
    }
  }

  async destroy() {
    this.forceCloseChannel = true;
    this.forceCloseConnection = true;
    const pormiseArr: any[] = [];
    for (const k in this.channelPool) {
      pormiseArr.push(this.closeChannel(this.channelPool[k].channel));
      delete this.channelPool[k];
    }
    try {
      await Promise.all(pormiseArr);
    } finally {
      await this.close();
    }
  }
}


export interface ConsumerConfig {
  env?: string[];
  disable?: boolean;
  prefetch?: number;
  queueName: string;
  options?: Options.Consume;
}

export abstract class BaseHandler {
  // eslint-disable-next-line no-useless-constructor
  constructor(public app: Application) {}

  abstract config: ConsumerConfig

  abstract async handler(msg: RabbitMQConsumeMsg): Promise<boolean>
}

type TypeofBaseHandler = { new(app: Application): BaseHandler }

export async function loadConsumers(app: Application) {
  app.loader.loadToApp(join(app.baseDir, 'app/consumer'), 'rabbitConsumer', {
    async initializer(Handler: TypeofBaseHandler, opt) {
      const handlerClass = new Handler(app);
      if (handlerClass.config.disable !== true) {
        await app.rabbitmq.subscribeConsumer({
          queueName: handlerClass.config.queueName,
          consumerName: opt.pathName,
          prefetch: handlerClass.config.prefetch,
          options: handlerClass.config.options,
          handler: handlerClass.handler.bind(handlerClass),
        });
        app.coreLogger.info('[egg-ali-rocketmq] subscribe queue "%s" -> "%s"', handlerClass.config.queueName, opt.pathName);
      }
      return handlerClass;
    },
  });
}

