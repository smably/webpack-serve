const { validate } = require('@webpack-contrib/cli-utils');

const flags = require('../schemas/flags.json');

function parseGroup(obj, prefix) {
  let result;
  for (const key of Object.keys(obj)) {
    if (key.indexOf(prefix) === 0) {
      if (!result) {
        result = {};
      }
      const name = key.replace(prefix, '').toLowerCase();
      result[name] = obj[key];
    }
  }
  return result;
}

module.exports = {
  flags,

  apply(argv) {
    const result = {};
    const https = parseGroup(argv, 'https');
    const open = parseGroup(argv, 'open');
    const devMiddleware = argv.devWare || {};
    const hotClient = argv.hotClient || {};

    validate({ argv, flags, prefix: 'serve' });

    if (https) {
      if (https.pass) {
        https.passphrase = https.pass;
        delete https.pass;
      }

      result.https = https;
    }

    if (open) {
      if (!open.path) {
        open.path = '/';
      }
      result.open = open;
    }

    if (argv.hotClient === false) {
      hotClient.hmr = false;
    } else {
      if (argv.hmr === false) {
        hotClient.hmr = false;
      }

      if (argv.reload === false) {
        hotClient.reload = false;
      }
    }

    if (argv.logLevel) {
      result.logLevel = argv.logLevel;
      devMiddleware.logLevel = result.logLevel;
      hotClient.logLevel = result.logLevel;
    }

    if (argv.logTime) {
      result.logTime = true;
      devMiddleware.logTime = true;
      hotClient.logTime = true;
    }

    if (Object.keys(devMiddleware).length) {
      result.devMiddleware = devMiddleware;
    }

    if (Object.keys(hotClient).length) {
      result.hotClient = hotClient;
    }

    return result;
  },
};
