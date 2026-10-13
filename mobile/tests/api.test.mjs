import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import ts from 'typescript';

const originalUrl = process.env.EXPO_PUBLIC_API_URL;
const originalDev = Object.getOwnPropertyDescriptor(globalThis, '__DEV__');
const { outputText } = ts.transpileModule(fs.readFileSync(new URL('../services/api.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { api } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const connectionError = /Unable to connect\. Check API configuration and connectivity\./;

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'https://example.test/';
  globalThis.__DEV__ = false;
});
afterEach(() => {
  if (originalDev) Object.defineProperty(globalThis, '__DEV__', originalDev);
  else delete globalThis.__DEV__;
  if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = originalUrl;
});

// Every test intercepts fetch. Assertions live outside the service's catch block.
function intercept(t, handler = async () => ({ ok: true, json: async () => ({ status: 'healthy' }) })) {
  return t.mock.method(globalThis, 'fetch', handler);
}
async function assertBlocked(t) {
  const fetch = intercept(t);
  await assert.rejects(api.health(), connectionError);
  await assert.rejects(api.welcome(), connectionError);
  assert.equal(fetch.mock.callCount(), 0, 'Invalid configuration must never invoke fetch');
}

test('missing API configuration blocks both endpoints', async t => {
  delete process.env.EXPO_PUBLIC_API_URL;
  await assertBlocked(t);
});

for (const [label, url] of [
  ['empty URL', ''],
  ['whitespace URL', '   '],
  ['malformed URL', 'not a URL'],
  ['relative URL', '/api'],
  ['unsupported protocol', 'ftp://example.test'],
  ['embedded credentials', 'https://user:password@example.test'],
  ['query string', 'https://example.test?key=value'],
  ['fragment', 'https://example.test#fragment'],
  ['production HTTP', 'http://192.168.1.100:8000'],
]) {
  test(`${label} blocks network requests`, async t => {
    process.env.EXPO_PUBLIC_API_URL = url;
    await assertBlocked(t);
  });
}

test('development HTTP remains supported', async t => {
  globalThis.__DEV__ = true;
  process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.100:8000';
  const fetch = intercept(t);
  assert.deepEqual(await api.health(), { status: 'healthy' });
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(fetch.mock.calls[0].arguments[0], 'http://192.168.1.100:8000/health');
});

test('valid HTTPS requests preserve existing backend contracts', async t => {
  const fetch = intercept(t, async url => ({ ok: true, json: async () => url.endsWith('/health') ? { status: 'healthy' } : { message: 'Welcome to FAIRWAY IQ', status: 'running' } }));
  assert.deepEqual(await api.health(), { status: 'healthy' });
  assert.deepEqual(await api.welcome(), { message: 'Welcome to FAIRWAY IQ', status: 'running' });
  assert.equal(fetch.mock.callCount(), 2);
  assert.equal(fetch.mock.calls[0].arguments[0], 'https://example.test/health');
  assert.equal(fetch.mock.calls[1].arguments[0], 'https://example.test/');
  assert.equal(fetch.mock.calls[0].arguments[1].headers.Accept, 'application/json');
});

for (const phase of ['fetch', 'response body']) {
  test(`ten-second timeout aborts a pending ${phase}`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let signal;
    const fetch = intercept(t, (_url, options) => {
      signal = options.signal;
      const stalled = () => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
      });
      return phase === 'fetch' ? stalled() : Promise.resolve({ ok: true, json: stalled });
    });
    const pending = api.health();
    const rejected = assert.rejects(pending, connectionError);
    // Allow the response-body branch to subscribe before advancing virtual time.
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(fetch.mock.callCount(), 1);
    t.mock.timers.tick(9999);
    assert.equal(signal.aborted, false);
    t.mock.timers.tick(1);
    assert.equal(signal.aborted, true);
    await rejected;
    assert.equal(fetch.mock.callCount(), 1, 'Timeout must not retry');
  });
}

test('completed requests clear the abort timer', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fetch = intercept(t);
  await api.health();
  const signal = fetch.mock.calls[0].arguments[1].signal;
  t.mock.timers.tick(10000);
  assert.equal(signal.aborted, false);
  assert.equal(fetch.mock.callCount(), 1);
});

for (const endpoint of ['health', 'welcome']) {
  test(`${endpoint} rejects malformed response shapes`, async t => {
    const invalid = [null, [], 'healthy', 42, {}, { status: 'unexpected' }, { status: 'running', message: 42 }];
    let index = 0;
    const fetch = intercept(t, async () => ({ ok: true, json: async () => invalid[index++] }));
    for (const _value of invalid) {
      await assert.rejects(api[endpoint](), new RegExp(`Unexpected ${endpoint} response`));
    }
    assert.equal(fetch.mock.callCount(), invalid.length);
  });
}

test('invalid JSON produces a safe error', async t => {
  const fetch = intercept(t, async () => ({ ok: true, json: async () => { throw new SyntaxError('private body content'); } }));
  await assert.rejects(api.health(), connectionError);
  assert.equal(fetch.mock.callCount(), 1);
});

test('HTTP failures do not read or expose private response bodies', async t => {
  let bodyReads = 0;
  const fetch = intercept(t, async () => ({ ok: false, json: async () => { bodyReads++; return { token: 'private' }; } }));
  await assert.rejects(api.health(), error => {
    assert.match(error.message, connectionError);
    assert.equal(error.message.includes('private'), false);
    return true;
  });
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(bodyReads, 0);
});

test('network failures produce a safe error without retrying', async t => {
  const fetch = intercept(t, async () => { throw new Error('private network details'); });
  await assert.rejects(api.health(), connectionError);
  assert.equal(fetch.mock.callCount(), 1);
});
