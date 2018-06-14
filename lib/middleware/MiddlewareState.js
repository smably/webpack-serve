const defer = require('p-defer');
const mem = require('mem');

module.exports = class MiddlewareState {
  constructor() {
    this.state = defer();
    const memo = mem(this.call);
    this.call = (...args) => {
      this.called = true;
      return memo(...args);
    };
  }

  call() {
    this.called = true;
  }
};
