import { Application } from 'egg';
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

  app.beforeStart(() => {
    loadConsumers(app);
  });

  return rabbitmq;
}

export default (app: Application) => {
  const config = app.config.rabbitmq;
  if (!config.client) {
    app.config.rabbitmq.client = Object.assign({}, config);
  }
  app.addSingleton('rabbitmq', createRabbitMQ);
};
