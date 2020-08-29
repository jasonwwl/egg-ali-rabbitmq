# egg-ali-rabbitmq

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-ali-rabbitmq.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-ali-rabbitmq
[travis-image]: https://travis-ci.com/jasonwwl/egg-ali-rabbitmq.svg?branch=master
[travis-url]: https://travis-ci.org/jasonwwl/egg-ali-rabbitmq
[download-url]: https://npmjs.org/package/egg-ali-rabbitmq
[download-image]: https://img.shields.io/npm/dm/egg-ali-rabbitmq.svg?style=flat-square

<!--
Description here.
-->

## Install

```bash
$ npm i egg-ali-rabbitmq --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.default = {
  enable: true,
  package: 'egg-ali-rabbitmq',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.rabbitmq = {
  url: 'HOST URL',
  vhost: 'VHOST',
  accessKeyId: 'ALIYUN ACCESS KEY ID',
  accessKeySecret: 'ALIYUN ACCESS KEY SECRET',
  instance: 'INSTANCE ID',
  options: {
    heartbeat: 30,
  },
};
```

see [config/config.default.js](config/config.default.js) for more detail.
