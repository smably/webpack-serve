const request = require('supertest');

const serve = require('../lib/index');

describe('serve', () => {
  test('serve', () => {
    const argv = { logLevel: 'silent' };
    const opts = {};
    return serve(argv, opts).then(({ app, options }) => {
      expect(app).toMatchSnapshot();
      expect(options).toMatchSnapshot();

      return new Promise((resolve) => {
        setTimeout(() => app.stop(resolve), 500);
      });
    });
  });

  test('serve basic config', () => {
    const argv = { logLevel: 'silent' };
    const opts = { config: require('./fixtures/basic/webpack.config') };
    return serve(argv, opts).then(({ app, on, options }) => {
      const { server } = app;
      expect(app).toMatchSnapshot();
      expect(options).toMatchSnapshot();

      return new Promise((resolve) => {
        on('build-finished', ({ stats }) => {
          expect(stats).toBeDefined();
          request(server)
            .get('/output.js')
            .expect(200)
            .then((response) => {
              expect(response.text).toMatchSnapshot();
              app.stop(resolve);
            });
        });
      });
    });
  });
});
