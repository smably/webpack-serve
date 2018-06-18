const { readFileSync: read } = require('fs');
const { resolve } = require('path');

const nodeVersion = require('node-version');

const mockClip = {
  throw: false,
  writeSync: jest.fn(() => {
    if (mockClip.throw) {
      throw new Error('mock clipboard error');
    }
  }),
};
const mockOpn = jest.fn(() => {});
const mockWeblog = {
  debug: jest.fn(() => {}),
  info: jest.fn(() => {}),
  warn: jest.fn(() => {}),
};

jest.mock('clipboardy', () => mockClip);
jest.mock('opn', () => mockOpn);
jest.mock('webpack-log', () => () => mockWeblog);

const { bind, getServer } = require('../lib/server');
const eventbus = require('../lib/bus');

const bus = eventbus({});

describe('server', () => {
  test('getServer', () => {
    const app = {
      callback() {},
    };
    const options = {};
    const result = getServer(app, options);
    expect(result).toMatchSnapshot();
  });

  if (nodeVersion.major > 6) {
    test('getServer http2', () => {
      const app = {
        callback() {},
      };

      const options = { http2: true };
      const result = getServer(app, options);
      expect(result).toMatchSnapshot();
    });
  }

  test('getServer https: cert/key', () => {
    const app = {
      callback() {},
    };
    const cert = read(resolve(__dirname, './fixtures/test-cert.pem'));
    const key = read(resolve(__dirname, './fixtures/test-key.pem'));
    const options = { https: { cert, key } };
    const result = getServer(app, options);
    expect(result).toMatchSnapshot({
      sessionIdContext: /\b[0-9a-f]{5,40}\b/,
    });
  });

  test('getServer https: pass/pfx', () => {
    const app = {
      callback() {},
    };
    const passphrase = 'sample';
    const pfx = read(resolve(__dirname, './fixtures/test-cert.pfx'));
    const options = {
      https: { passphrase, pfx },
    };
    const result = getServer(app, options);
    expect(result).toMatchSnapshot({
      sessionIdContext: /\b[0-9a-f]{5,40}\b/,
    });
  });

  test('getServer http2+https: cert/key', () => {
    const app = {
      callback() {},
    };
    const cert = read(resolve(__dirname, './fixtures/test-cert.pem'));
    const key = read(resolve(__dirname, './fixtures/test-key.pem'));
    const options = { http2: true, https: { cert, key } };
    const result = getServer(app, options);
    expect(result).toMatchSnapshot({
      sessionIdContext: /\b[0-9a-f]{5,40}\b/,
    });
  });

  test('bind', () => {
    const app = {
      callback() {},
    };
    const options = {
      bus,
      clipboard: true,
      host: 'localhost',
      protocol: 'https',
    };
    const server = getServer(app, options);

    bind(server, options);

    return new Promise((reslve) => {
      server.listen(0, 'localhost', () => {
        expect(mockClip.writeSync.mock.calls.length).toBe(1);
        setTimeout(() => server.kill(reslve), 500);
      });
    });
  });

  test('bind clipboard error', () => {
    mockClip.throw = true;
    const app = {
      callback() {},
    };
    const options = {
      bus,
      clipboard: true,
      host: 'localhost',
      protocol: 'https',
    };
    const server = getServer(app, options);

    bind(server, options);

    return new Promise((reslve) => {
      server.listen(0, 'localhost', () => {
        expect(mockWeblog.debug.mock.calls.length).toBe(1);
        expect(mockWeblog.debug.mock.calls).toMatchSnapshot();

        expect(mockWeblog.warn.mock.calls.length).toBe(1);
        expect(mockWeblog.warn.mock.calls).toMatchSnapshot();
        setTimeout(() => server.kill(reslve), 500);
      });
    });
  });

  test('bind open', () => {
    const app = {
      callback() {},
    };
    const options = {
      bus,
      open: true,
      host: 'localhost',
      protocol: 'https',
    };
    const server = getServer(app, options);

    bind(server, options);
    server.listen(0, 'localhost');

    return new Promise((reslve) => {
      server.listen(0, 'localhost', () => {
        expect(mockOpn.mock.calls.length).toBe(1);
        setTimeout(() => server.kill(reslve), 500);
      });
    });
  });
});
