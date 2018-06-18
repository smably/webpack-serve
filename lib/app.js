const getPort = require('get-port');
const Koa = require('koa');

const ContentMiddleware = require('./middleware/ContentMiddleware');
const WebpackMiddleware = require('./middleware/WebpackMiddleware');

const { bind, getServer } = require('./server');

module.exports = {
  getApp(options) {
    const app = new Koa();
    const contentMiddleware = new ContentMiddleware(app, options);
    const webpackMiddleware = new WebpackMiddleware(app, options);
    const middleware = {
      content: contentMiddleware.call,
      webpack: webpackMiddleware.call,
    };
    const server = getServer(app, options);
    const { start, stop } = module.exports;

    bind(server, options);

    const result = Object.assign(app, {
      server,
      start: start.bind(null, app, middleware, server, options),
      stop: stop.bind(null, webpackMiddleware, server),
    });

    return result;
  },

  start(app, middleware, server, options) {
    const { host } = options;
    let { port } = options;
    let promise;

    if (options.port === 0) {
      promise = Promise.resolve(server.listen(port, host));
    } else {
      promise = getPort({ port, host }).then((freePort) => {
        port = freePort;
        return server.listen(port, host);
      });
    }

    return promise.then(() => {
      if (typeof options.add === 'function') {
        options.add(app, middleware, options);
      }

      // this function is memo'd, so even if it's called in options.add, we're
      // safe
      middleware.content.call();
      return middleware.webpack.call().then(() => server);
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
