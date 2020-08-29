import { createHmac } from 'crypto';

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
