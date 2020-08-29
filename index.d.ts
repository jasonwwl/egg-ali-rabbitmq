import { EggAliRabbitMQConfig } from './config/config.default';
import { RabbitMQProducer } from './lib/rabbitmq';
export * from './lib/rabbitmq';

declare module 'egg' {
  interface EggAppConfig {
    rabbitmq: EggAliRabbitMQConfig;
  }

  interface Application {
    rabbitmq: RabbitMQProducer;
  }

  interface Context {

  }
}
