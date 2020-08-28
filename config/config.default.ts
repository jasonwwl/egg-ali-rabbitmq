
export interface EggAliRabbitMQConfig {
  url: string;
  vhost?: string;
  accessKeyId: string;
  accessKeySecret: string;
  securityToken?: string;
  instance: string;
  options?: {
    [k: string]: any;
  };
}

// /**
//  * egg-ali-rabbitmq default config
//  * @member Config#aliRabbitmq
//  * @property {String} SOME_KEY - some description
//  */
export const rabbitmq = {
  url: '',
  vhost: '',
  accessKeyId: '',
  accessKeySecret: '',
  securityToken: '',
  instance: '',
  options: {},
};
