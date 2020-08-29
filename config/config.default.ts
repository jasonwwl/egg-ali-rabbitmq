
export interface EggAliRabbitMQConfig {
  url: string;
  vhost?: string;
  accessKeyId: string;
  accessKeySecret: string;
  securityToken?: string;
  instance: string;
  isConfirmChannel?: boolean;
  options?: {
    [k: string]: any;
  };
}

// /**
//  * egg-ali-rabbitmq default config
//  * @member Config#aliRabbitmq
//  * @property {String} SOME_KEY - some description
//  */
export const rabbitmq: EggAliRabbitMQConfig = {
  url: '',
  vhost: '',
  accessKeyId: '',
  accessKeySecret: '',
  securityToken: '',
  instance: '',
  isConfirmChannel: true,
  options: {},
};
