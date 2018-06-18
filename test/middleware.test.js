const { inspect } = require('util');

const webpack = require('webpack');

const ContentMiddleware = require('../lib/middleware/ContentMiddleware');
const MiddlewareState = require('../lib/middleware/MiddlewareState');
const WebpackMiddleware = require('../lib/middleware/WebpackMiddleware');

describe('middleware', () => {
  test('MiddlewareState', () => {
    const ware = new MiddlewareState();
    expect(ware.state).toBeDefined();
    expect(ware.called).toBe(false);
    ware.call();
    expect(ware.called).toBe(true);
  });

  test('MiddlewareState memo', () => {
    class TestMiddleware extends MiddlewareState {
      // eslint-disable-next-line class-methods-use-this
      call() {
        return +new Date();
      }
    }
    const ware = new TestMiddleware();
    expect(ware.state).toBeDefined();
    expect(ware.called).toBe(false);

    const result = ware.call();

    expect(ware.called).toBe(true);
    expect(ware.call()).toBe(result);
  });

  test('ContentMiddleware', () => {
    const app = {
      used: [],
      use(what) {
        app.used.push(inspect(what));
      },
    };
    const content = ['./batman', './superman'];
    const ware = new ContentMiddleware(app, { content });

    ware.call({});

    return ware.state.then(() => {
      expect(app.used).toMatchSnapshot();
    });
  });

  test('WebpackMiddleware', () => {
    const app = {
      used: [],
      use(what) {
        const value = inspect(what).replace(
          /startTime: \d+/g,
          'startTime: <START_TIME>'
        );
        app.used.push(value);
      },
    };
    const config = require('./fixtures/basic/webpack.config');
    const compiler = webpack(config);
    const logLevel = 'silent';
    const devMiddleware = { publicPath: '/', logLevel };
    const options = { compiler, devMiddleware, hotClient: { logLevel } };
    const ware = new WebpackMiddleware(app, options);

    return ware.call().then((koaWebpack) => {
      expect(app.used).toMatchSnapshot();
      expect(koaWebpack).toBeDefined();
      const value = inspect(koaWebpack).replace(/port: \d+/g, 'port: <PORT>');
      expect(value).toMatchSnapshot();

      const { hotClient } = koaWebpack;
      expect(hotClient.server.host).toBe('127.0.0.1');
      expect(hotClient.server.port).toBeGreaterThan(0);

      return new Promise((resolve) => koaWebpack.close(resolve));
    });
  });

  test('WebpackMiddleware Error', () => {
    const app = {
      use() {},
    };
    const config = require('./fixtures/basic/webpack.config');
    const compiler = webpack(config);
    const logLevel = 'silent';
    const devMiddleware = { publicPath: '/', logLevel };
    const options = {
      compiler,
      devMiddleware,
      hotClient: { logLevel, port: 'fail' },
    };
    const ware = new WebpackMiddleware(app, options);

    return Promise.all([
      ware.call().catch((error) => {
        expect(error).toMatchSnapshot();
      }),
      ware.state.then((result) => {
        expect(result instanceof Error).toBe(true);
        expect(result).toMatchSnapshot();
      }),
    ]);
  });
});
