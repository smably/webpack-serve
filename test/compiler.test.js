const webpack = require('webpack');

const eventbus = require('../lib/bus');
const { getCompiler } = require('../lib/compiler');

const bus = eventbus({});
const compile = (compiler) => new Promise((resolve) => compiler.run(resolve));
const getConfig = (name) => require(`./fixtures/${name}/webpack.config`);
const waitForEvent = (name) => new Promise((resolve) => bus.on(name, resolve));

/* eslint-disable no-param-reassign */

// this is all to allow for cross-node-version snapshot comparison
const pick = ({ context, name, options }) => {
  delete options.optimization;
  return { context, name, options };
};

describe('compiler', () => {
  test('getCompiler', () => {
    const config = getConfig('basic');
    const result = getCompiler([config], { bus });
    const picked = pick(result);

    expect(picked).toMatchSnapshot();

    return Promise.all([
      waitForEvent('build-started').then((data) => {
        expect(Object.keys(data)).toMatchSnapshot();
        expect(data.compiler.constructor.name).toMatchSnapshot();
      }),
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
    const picked = pick(result);

    expect(picked).toMatchSnapshot();

    return Promise.all([
      waitForEvent('build-started').then((data) => {
        expect(Object.keys(data)).toMatchSnapshot();
        expect(data.compiler.constructor.name).toMatchSnapshot();
      }),
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
    const picked = pick(result);

    expect(picked).toMatchSnapshot();

    return Promise.all([
      compile(result),
      waitForEvent('compiler-error').then((data) =>
        expect(data.json).toMatchSnapshot({
          builtAt: /\d+/,
          time: /\d+/,
          version: /\d+\.\d+\.\d+/,
        })
      ),
      waitForEvent('build-finished'),
    ]);
  });

  test('warnings', () => {
    const config = getConfig('warning');
    const result = getCompiler([config], { bus });
    const picked = pick(result);

    expect(picked).toMatchSnapshot();

    return Promise.all([
      compile(result),
      waitForEvent('compiler-warning').then((data) => {
        data.json.warnings = data.json.warnings.map((warning) =>
          warning.replace(/\s+at(.+)\)\n/g, '')
        );
        expect(data.json).toMatchSnapshot({
          builtAt: /\d+/,
          time: /\d+/,
          version: /\d+\.\d+\.\d+/,
        });
      }),
      waitForEvent('build-finished'),
    ]);
  });

  test('invalid config error', () => {
    const config = require('./fixtures/invalid.config');
    const fn = () => getCompiler([config], { bus });

    expect(fn).toThrowErrorMatchingSnapshot();
  });
});
