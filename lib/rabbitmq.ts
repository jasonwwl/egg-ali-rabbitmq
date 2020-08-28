import { createHmac } from 'crypto';
import { Application } from 'egg';
import { connect } from 'amqplib';
import { stringify } from 'querystring';
import { EggAliRabbitMQConfig } from '../config/config.default';

export function getUsername(accessKeyId: string, instance: string, securityToken?: string): string {
  const ACCESS_FROM_USER = 0;
  const payload: (number|string)[] = [ ACCESS_FROM_USER, accessKeyId, instance ];
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

export function filterURLSecret(url: string) {
  const index = url.indexOf('@');
  if (index === -1) return url;

  // const startIndex = input.lastIndexOf(':', index);
  // return input.substring(0, startIndex + 1) + '******' + input.substring(index);
}

export async function createConnection(config: EggAliRabbitMQConfig, app: Application) {
  const username = getUsername(config.accessKeyId, config.instance, config.securityToken);
  const password = getPassword(config.accessKeySecret);
  const queryString = config.options ? `?${stringify(config.options)}` : '';
  const url = `amqp://${username}:${password}@${config.url}/${config.vhost}${queryString}`;
  app.coreLogger.info('[egg-ali-rocketmq] connecting %s');
  const conn = await connect(url);
  conn.on('error', err => {
    app.coreLogger.error('[egg-ali-rocketmq] ', err);
  });
}
