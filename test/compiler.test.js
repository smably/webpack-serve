const webpack = require('webpack');

const eventbus = require('../lib/bus');
const { getCompiler } = require('../lib/compiler');

/* eslint-disable global-require, import/no-dynamic-require */

const bus = eventbus({});
const compile = (compiler) => new Promise((resolve) => compiler.run(resolve));
const getConfig = (name) => require(`./fixtures/${name}/webpack.config`);
const waitForEvent = (name) => new Promise((resolve) => bus.on(name, resolve));

describe('compiler', () => {
  test('getCompiler', () => {
    const config = getConfig('basic');
    const result = getCompiler([config], { bus });

    expect(result).toMatchSnapshot();

    return Promise.all([
      waitForEvent('build-started').then((data) =>
        expect(data).toMatchSnapshot()
      ),
      compile(result),
      waitForEvent('build-finished').then((data) =>
        expect(data.stats.toJson()).toMatchSnapshot({
          builtAt: /\d+/,
          time: /\d+/,
        })
      ),
    ]);
  });

  test('getCompiler with existing compiler', () => {
    const config = getConfig('basic');
    const compiler = webpack(config);
    const result = getCompiler([], { bus, compiler });

    expect(result).toMatchSnapshot();

    return Promise.all([
      waitForEvent('build-started').then((data) =>
        expect(data).toMatchSnapshot()
      ),
      compile(result),
      waitForEvent('build-finished').then((data) =>
        expect(data.stats.toJson()).toMatchSnapshot({
          builtAt: /\d+/,
          time: /\d+/,
        })
      ),
    ]);
  });

  test('errors', () => {
    const config = getConfig('error');
    const result = getCompiler([config], { bus });

    expect(result).toMatchSnapshot();

    return Promise.all([
      compile(result),
      waitForEvent('compiler-error').then((data) =>
        expect(data.json).toMatchSnapshot({
          builtAt: /\d+/,
          time: /\d+/,
        })
      ),
      waitForEvent('build-finished'),
    ]);
  });

  test('errors', () => {
    const config = getConfig('warning');
    const result = getCompiler([config], { bus });

    expect(result).toMatchSnapshot();

    return Promise.all([
      compile(result),
      waitForEvent('compiler-warning').then((data) =>
        expect(data.json).toMatchSnapshot({
          builtAt: /\d+/,
          time: /\d+/,
        })
      ),
      waitForEvent('build-finished'),
    ]);
  });

  test('invalid config error', () => {
    const config = require('./fixtures/invalid.config');
    const fn = () => getCompiler([config], { bus });

    expect(fn).toThrowErrorMatchingSnapshot();
  });
});
