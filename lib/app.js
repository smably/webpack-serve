const getPort = require('get-port');
const Koa = require('koa');

const ContentMiddleware = require('./middleware/ContentMiddleware');
const WebpackMiddleware = require('./middleware/WebpackMiddleware');

const { bind, getServer } = require('./server');

module.exports = {
  getApp(options) {
    const app = new Koa();
    const contentMiddlware = new ContentMiddleware(app, options);
    const webpackMiddlware = new WebpackMiddleware(app, options);
    const middleware = {
      content: contentMiddlware.call,
      webpack: webpackMiddlware.call,
    };
    const server = getServer(app, options);
    const { start, stop } = module.exports;

    bind(server, options);

    if (typeof options.add === 'function') {
      options.add(app, middleware, options);
    }

    const result = Object.extend(app, {
      server,
      start: start.bind(null, server, options),
      stop: stop.bind(null, server, options),
    });

    return result;
  },

  start(server, options) {
    const { host } = options;
    let { port } = options;
    if (options.port === 0) {
      return Promise.resolve(server.listen(port, host));
    }

    return getPort({ port, host }).then((freePort) => {
      port = freePort;
      return server.listen(port, host);
    });
  },

  stop(middleware, server, fn) {
    server.kill(() => {
      const { called, koaMiddleware, state } = middleware;
      if (called) {
        state.then(() => koaMiddleware.close(fn));
      }
    });
  },
};
