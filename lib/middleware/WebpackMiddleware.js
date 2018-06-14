const koaWebpack = require('koa-webpack');

const WebpackServeError = require('../WebpackServeError');

module.exports = class WebpackMiddleware {
  constructor(app, options) {
    this.super();
    this.app = app;
    this.options = options;
  }

  call() {
    super.call();

    const { options } = this;
    const koaWebpackOpts = {
      compiler: options.compiler,
      devMiddleware: options.dev,
      hotClient: options.hot,
    };

    return koaWebpack(koaWebpackOpts)
      .then((result) => {
        this.koaMiddleware = result;
        this.app.use(this.koaMiddleware);
        this.state.resolve();
      })
      .catch((e) => {
        this.state.resolve(e);
        throw new WebpackServeError(
          `An error was thrown while initializing koa-webpack\n ${e.toString()}`
        );
      });
  }
};
