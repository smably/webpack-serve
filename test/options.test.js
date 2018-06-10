// const { resolve } = require('path');

const { getOptions } = require('../lib/options');

describe('options', () => {
  test('defaults', () => {
    const argv = {};
    const opts = {};
    return getOptions(argv, opts).then((result) => {
      expect(result).toMatchSnapshot();
    });
  });
});
