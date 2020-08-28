# egg-ali-rabbitmq

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-ali-rabbitmq.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-ali-rabbitmq
[travis-image]: https://img.shields.io/travis/eggjs/egg-ali-rabbitmq.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-ali-rabbitmq
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-ali-rabbitmq.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-ali-rabbitmq?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-ali-rabbitmq.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-ali-rabbitmq
[snyk-image]: https://snyk.io/test/npm/egg-ali-rabbitmq/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-ali-rabbitmq
[download-image]: https://img.shields.io/npm/dm/egg-ali-rabbitmq.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-ali-rabbitmq

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
exports.aliRabbitmq = {
  enable: true,
  package: 'egg-ali-rabbitmq',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.aliRabbitmq = {
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

<!-- example here -->

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
