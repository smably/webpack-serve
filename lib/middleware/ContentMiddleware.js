const statik = require('@shellscape/koa-static/legacy');

const MiddlewareState = require('./MiddlewareState');

module.exports = class ContentMiddleware extends MiddlewareState {
  constructor(app, options) {
    super();

    this.app = app;
    this.options = options;
  }

  call(staticOptions = {}) {
    for (const dir of this.options.content) {
      this.app.use(statik(dir, staticOptions));
    }

    this.deferred.resolve();

    return this.state;
  }
};
