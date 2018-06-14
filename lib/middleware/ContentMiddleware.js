const statik = require('@shellscape/koa-static/legacy');

module.exports = class ContentMiddleware {
  constructor(app, options) {
    this.super();
    this.app = app;
    this.options = options;
  }

  call(staticOptions) {
    super.call();

    for (const dir of this.options.content) {
      this.app.use(statik(dir, staticOptions || {}));
    }

    return Promise.resolve(this.state.resolve());
  }
};
