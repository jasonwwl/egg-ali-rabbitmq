import { createHmac } from 'crypto';
import { Application } from 'egg';
import { connect, Connection, Channel, ConfirmChannel, Options, ConsumeMessage } from 'amqplib';
import { stringify } from 'querystring';
import { EggAliRabbitMQConfig } from '../config/config.default';
import { join } from 'path';

export interface IRabbitMQOptions {
  confirmChannel?: boolean;
}

export interface IRabbitMQPublishPayload {
  exchange: string;
  routingKey: string;
  message: any;
  options?: Options.Publish;
}

export interface IRabbitMQConsumeOptions {
  prefetch?: number;
  queueName: string;
  options?: Options.Consume;
}

export class BaseRabbitMQ {
  public channel: Channel | ConfirmChannel

  // eslint-disable-next-line no-useless-constructor
  constructor(public eggApp: Application, public conn: Connection, public options: IRabbitMQOptions) {}

  async createChannel() {
    this.channel = this.options.confirmChannel ? await this.conn.createConfirmChannel() : await this.conn.createChannel();
  }

  async initChannel() {
    await this.createChannel();
  }
}
export class RabbitMQProducer extends BaseRabbitMQ {
  async publish(payload: IRabbitMQPublishPayload) {
    const { exchange, routingKey, message, options } = payload;
    return new Promise((resolve, reject) => {
      if (this.options.confirmChannel) {
        this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), options, err => {
          if (err) {
            reject(err);
            return null;
          }
          resolve(true);
        });
      } else {
        const res = this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
        if (res) {
          resolve(true);
        } else {
          reject(new Error('publish result return false'));
        }
      }
    });
  }
}

export class RabbitMQConsumeMsg {
  // eslint-disable-next-line no-useless-constructor
  constructor(public channel: Channel, protected msg: ConsumeMessage) {}

  protected cacheContent: any

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

export class RabbitMQConsumer extends BaseRabbitMQ {
  public consumerTag: string | null
  async consume(options: IRabbitMQConsumeOptions, fn: BaseHandler['handler']) {
    const channel = await this.conn.createChannel();
    channel.prefetch(options.prefetch || 1);
    const resp = await channel.consume(options.queueName, async msg => {
      if (msg) {
        try {
          await fn(new RabbitMQConsumeMsg(channel, msg));
        } catch (e) {
          this.eggApp.coreLogger.error('[egg-ali-rocketmq] consumer error! queue: %s, errmsg: %s, stack:%s', options.queueName, e.message, e.stack);
        }
      }
    }, options.options);
    this.consumerTag = resp.consumerTag;
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

type TypeofBaseHandler = {new(app: Application): BaseHandler}

export function getUsername(accessKeyId: string, instance: string, securityToken?: string): string {
  const ACCESS_FROM_USER = 0;
  const payload: (number|string)[] = [ ACCESS_FROM_USER, instance, accessKeyId ];
  if (securityToken) {
    payload.push(securityToken);
  }
  return Buffer.from(payload.join(':')).toString('base64');
}

export function getPassword(accessKeySecret: string): string {
  const timestamp = Date.now().toString();
  const signature = createHmac('sha1', timestamp)
    .update(accessKeySecret)
    .digest('hex')
    .toUpperCase();
  return Buffer.from(`${signature}:${timestamp}`).toString('base64');
}

export function filterURLSecret(url: string, secret: string[]) {
  let secretUrl = url;
  secret.forEach(v => {
    secretUrl = secretUrl.replace(new RegExp(v, 'g'), '*secret*');
  });
  return secretUrl;
}

export async function createConnection(config: EggAliRabbitMQConfig, app: Application) {
  const username = getUsername(config.accessKeyId, config.instance, config.securityToken);
  const password = getPassword(config.accessKeySecret);
  const queryString = config.options ? `?${stringify(config.options)}` : '';
  const url = `amqp://${username}:${password}@${config.url}/${config.vhost}${queryString}`;
  app.coreLogger.info('[egg-ali-rocketmq] connecting %s', filterURLSecret(url, [ username, password ]));
  const conn = await connect(url);
  conn.on('error', err => {
    app.coreLogger.error('[egg-ali-rocketmq] ', err);
  });
  return conn;
}

export async function loadConsumers(app: Application, conn: Connection) {

  app.loader.loadToApp(join(app.baseDir, 'app/consumer'), 'rabbitConsumer', {
    async initializer(Handler: TypeofBaseHandler, opt) {
      const handler = new Handler(app);
      if (handler.config.disable !== true) {
        const consumer = new RabbitMQConsumer(app, conn, {
          confirmChannel: false,
        });
        await consumer.initChannel();
        await consumer.consume(
          {
            prefetch: handler.config.prefetch,
            queueName: handler.config.queueName,
            options: handler.config.options,
          },
          handler.handler
        );
        app.coreLogger.info('[egg-ali-rocketmq] subscribe queue "%s" -> "%s"', handler.config.queueName, opt.pathName);
      }
      return handler;
    },
  });
}

