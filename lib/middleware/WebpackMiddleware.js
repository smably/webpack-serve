const koaWebpack = require('koa-webpack');

const WebpackServeError = require('../WebpackServeError');

const MiddlewareState = require('./MiddlewareState');

module.exports = class WebpackMiddleware extends MiddlewareState {
  constructor(app, options) {
    super();
    this.app = app;
    this.options = options;
  }

  call() {
    const { options } = this;
    const koaWebpackOpts = {
      compiler: options.compiler,
      devMiddleware: options.devWare,
      hotClient: options.hotClient,
    };

    return koaWebpack(koaWebpackOpts)
      .then((result) => {
        this.koaMiddleware = result;
        this.app.use(result.devMiddleware);
        this.deferred.resolve(this.koaMiddleware);

        return result;
      })
      .catch((e) => {
        // this looks weird, but for ease of use we always want to resolve.
        // we'll check the resolved value down the pipe
        this.deferred.resolve(e);
        throw new WebpackServeError(
          `An error was thrown while initializing koa-webpack\n ${e.toString()}`
        );
      });
  }
};
