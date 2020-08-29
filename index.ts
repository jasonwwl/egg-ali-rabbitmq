export * from './lib/rabbitmq';

import { EggAliRabbitMQConfig } from './config/config.default';
import { RabbitMQ } from './lib/rabbitmq';
export * from './lib/rabbitmq';

declare module 'egg' {
  interface EggAppConfig {
    rabbitmq: EggAliRabbitMQConfig;
  }

  interface Application {
    rabbitmq: RabbitMQ;
  }

  interface Context {

  }
}
