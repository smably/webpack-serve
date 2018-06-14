const webpack = require('webpack');

const WebpackServeError = require('./WebpackServeError');

module.exports = {
  getCompiler(configs, options) {
    const { bus } = options;
    let { compiler } = options;

    if (!compiler) {
      try {
        compiler = webpack(configs.length > 1 ? configs : configs[0]);
      } catch (e) {
        throw new WebpackServeError(
          `An error was thrown while initializing Webpack\n  ${e.toString()}`
        );
      }
    }

    const compilers = compiler.compilers || [compiler];

    for (const comp of compilers) {
      comp.hooks.compile.tap('WebpackServe', () => {
        bus.emit('build-started', { compiler: comp });
      });

      comp.hooks.done.tap('WebpackServe', (stats) => {
        const json = stats.toJson();
        if (stats.hasErrors()) {
          bus.emit('compiler-error', { json, compiler: comp });
        }

        if (stats.hasWarnings()) {
          bus.emit('compiler-warning', { json, compiler: comp });
        }

        bus.emit('build-finished', { stats, compiler: comp });
      });
    }

    return compiler;
  },
};
