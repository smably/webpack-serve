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

  test('serve config + add', () => {
    const argv = { logLevel: 'silent' };
    const opts = {
      add(app, middleware) {
        middleware.webpack();

        middleware.content({
          index: 'index.htm',
        });
      },
      config: require('./fixtures/htm/webpack.config'),
    };

    return serve(argv, opts).then(({ app }) => {
      const req = request(app.server);
      return Promise.all([
        req.get('/index.htm').expect(200),
        req.get('/output.js').expect(200),
      ]).then(() => new Promise((resolve) => app.stop(resolve)));
    });
  });

  test('serve multi config', () => {
    const argv = { logLevel: 'silent' };
    const opts = { config: require('./fixtures/multi/webpack.config') };
    return serve(argv, opts).then(({ app }) => {
      const req = request(app.server);
      return Promise.all([
        req.get('/static/client.js').expect(200),
        req.get('/server/server.js').expect(200),
      ]).then(() => new Promise((resolve) => app.stop(resolve)));
    });
  });

  test('serve multi-named config', () => {
    const argv = { logLevel: 'silent' };
    const opts = { config: require('./fixtures/multi-named/webpack.config') };
    return serve(argv, opts).then(({ app }) => {
      const req = request(app.server);
      return Promise.all([
        req.get('/bundle1.js').expect(200),
        req.get('/bundle2.js').expect(200),
      ]).then(() => new Promise((resolve) => app.stop(resolve)));
    });
  });

  test('serve webpack 4 defaults config', () => {
    const argv = { logLevel: 'silent' };
    const opts = {
      config: require('./fixtures/webpack-4-defaults/webpack.config'),
    };
    return serve(argv, opts).then(({ app }) => {
      const req = request(app.server);
      return Promise.all([
        req.get('/index.html').expect(200),
        req.get('/main.js').expect(200),
      ]).then(() => new Promise((resolve) => app.stop(resolve)));
    });
  });
});
