import { EggAliRabbitMQConfig } from './config/config.default';

declare module 'egg' {
  interface EggAppConfig {
    rabbitmq: EggAliRabbitMQConfig;
  }

  interface Application {
    rabbit: string;
  }

  interface Context {

  }
}
