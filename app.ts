import { Application, IBoot } from 'egg';
import { loadConsumers, RabbitMQ } from './lib/rabbitmq';
import { EggAliRabbitMQConfig } from './config/config.default';

async function createRabbitMQ(config: EggAliRabbitMQConfig, app: Application) {
  // console.log(config);
  const rabbitmq = new RabbitMQ(config);

  rabbitmq.on('connecting', url => {
    app.coreLogger.info('[egg-ali-rocketmq] connecting %s', url);
  });

  rabbitmq.on('reconnecting', url => {
    app.coreLogger.warn('[egg-ali-rocketmq] reconnecting %s', url);
  });

  rabbitmq.on('connected', ({ url }) => {
    app.coreLogger.info('[egg-ali-rocketmq] connected %s', url);
  });

  rabbitmq.on('blocked', info => {
    app.coreLogger.info('[egg-ali-rocketmq] blocked: %s', info);
  });

  rabbitmq.on('unblocked', info => {
    app.coreLogger.info('[egg-ali-rocketmq] blocked: %s', info || null);
  });

  rabbitmq.on('error', err => {
    app.coreLogger.error('[egg-ali-rocketmq] connection error', err);
  });

  rabbitmq.on('close', err => {
    app.coreLogger.info('[egg-ali-rocketmq] connection close', err);
  });

  rabbitmq.on('ch_close', ({ channelName }) => {
    app.coreLogger.info('[egg-ali-rocketmq] channel "%s" is closed', channelName);
  });

  rabbitmq.on('ch_error', ({ channelName, error }) => {
    app.coreLogger.error('[egg-ali-rocketmq] channel "%s" error', channelName, error);
  });

  rabbitmq.on('ch_return', ({ channelName, msg }) => {
    app.coreLogger.info('[egg-ali-rocketmq] channel "%s" return msg: %s', channelName, msg);
  });

  rabbitmq.on('ch_drain', ({ channelName }) => {
    app.coreLogger.info('[egg-ali-rocketmq] channel "%s" drain', channelName);
  });

  rabbitmq.on('ch_connected', ({ channelName }) => {
    app.coreLogger.info('[egg-ali-rocketmq] channel "%s" is connected', channelName);
  });

  rabbitmq.on('ch_reconnecting', ({ channelName }) => {
    app.coreLogger.info('[egg-ali-rocketmq] channel "%s" reconnecting...', channelName);
  });

  rabbitmq.on('ch_connecting', ({ channelName }) => {
    app.coreLogger.info('[egg-ali-rocketmq] channel "%s" connecting...', channelName);
  });

  await rabbitmq.connect();
  await rabbitmq.initProducerChannel(config.isConfirmChannel || true);

  // app.beforeStart(() => {
  //   loadConsumers(app);
  // });

  return rabbitmq;
}

// export default (app: Application) => {
// const config = app.config.rabbitmq;
// if (!config.client) {
//   app.config.rabbitmq.client = Object.assign({}, config);
// }
//   app.addSingleton('rabbitmq', createRabbitMQ);
// };


export default class AppBoot implements IBoot {
  // eslint-disable-next-line no-useless-constructor
  constructor(private readonly app: Application) {}

  configWillLoad() {
    // Ready to call configDidLoad,
    // Config, plugin files are referred,
    // this is the last chance to modify the config.
  }

  configDidLoad() {
    // Config, plugin files have loaded.
    const config = this.app.config.rabbitmq;
    if (!config.client) {
      this.app.config.rabbitmq.client = Object.assign({}, config);
    }
  }

  async didLoad() {
    // 所有的配置已经加载完毕
    // 可以用来加载应用自定义的文件，启动自定义的服务
    this.app.addSingleton('rabbitmq', createRabbitMQ);
  }


  async willReady() {
    // All plugins have started, can do some thing before app ready.
  }

  async didReady() {
    // Worker is ready, can do some things
    // don't need to block the app boot.
    loadConsumers(this.app);
  }

  async serverDidReady() {
    // Server is listening.
  }

  async beforeClose() {
    // Do some thing before app close.
    await this.app.rabbitmq.destroy();
  }

}
