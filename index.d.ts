import { EggAliRabbitMQConfig } from 'config/config.default';

declare module 'egg' {
  interface EggAppConfig {
    aliRabbitmq: EggAliRabbitMQConfig;
  }

  interface Application {

  }

  interface Context {

  }
}
