'use strict';

const mock = require('egg-mock');

describe('test/ali-rabbitmq.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/ali-rabbitmq-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, aliRabbitmq')
      .expect(200);
  });
});
