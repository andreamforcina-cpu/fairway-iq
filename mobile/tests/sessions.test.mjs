import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function load(path, replacements = {}) {
  let source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replace(from, to);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { createSessionManager } = await load('../services/sessionManager.ts');
const { sessionApi, AuthError } = await load('../services/sessionApi.ts', { "import { baseUrl } from './api';": "const baseUrl = () => 'https://example.test';" });
const profile = { id: 'test-user', full_name: 'Test Golfer', email: 'golfer@example.test', created_at: '2026-10-14T12:00:00Z' };
function pair(n = 0) { return { access_token: `fiqa_${String(n).padStart(43, 'a')}`, refresh_token: `fiqr_${String(n).padStart(43, 'r')}`, expires_in: 900, refresh_expires_in: 2592000, token_type: 'bearer' }; }
function fixture() {
  let saved = null, clock = 0, count = 0;
  const states = [], calls = [];
  const storage = { read: async () => saved, write: async value => { saved = value; }, clear: async () => { saved = null; } };
  const api = { login: async () => pair(), refresh: async token => { calls.push(['refresh', token, saved]); return pair(++count); }, logout: async token => { calls.push(['logout', token]); }, me: async token => { calls.push(['me', token]); return profile; } };
  const manager = createSessionManager(api, storage, state => states.push(state), () => clock);
  return { manager, api, storage, states, calls, saved: () => saved, save: value => { saved = value; }, advance: () => { clock += 900000; } };
}
test('login persists only refresh and publishes profile without tokens', async () => {
  const f = fixture(); await f.manager.login('', '');
  assert.equal(f.saved(), pair().refresh_token);
  assert.deepEqual(f.states.at(-1), { loading: false, user: profile, message: '' });
  assert.doesNotMatch(JSON.stringify(f.states), /fiq[ar]_/);
});
test('restore deletes refresh before sending and stores replacement', async () => {
  const f = fixture(); f.save(pair().refresh_token); await f.manager.restore();
  assert.deepEqual(f.calls[0], ['refresh', pair().refresh_token, null]);
  assert.equal(f.saved(), pair(1).refresh_token); assert.deepEqual(f.states.at(-1).user, profile);
});
test('concurrent expiry checks rotate once', async () => {
  const f = fixture(); await f.manager.login('', ''); f.advance();
  await Promise.all([f.manager.revalidate(), f.manager.revalidate(), f.manager.revalidate()]);
  assert.equal(f.calls.filter(c => c[0] === 'refresh').length, 1);
  assert.ok(f.calls.slice(-3).every(c => c[1] === pair(1).access_token));
});
test('lost refresh response never replays consumed token', async () => {
  const f = fixture(); await f.manager.login('', ''); f.advance();
  let attempts = 0; f.api.refresh = async () => { attempts++; throw new Error('network'); };
  await Promise.all([f.manager.revalidate(), f.manager.revalidate()]); await f.manager.restore();
  assert.equal(attempts, 1); assert.equal(f.saved(), null); assert.equal(f.states.at(-1).user, null);
});
test('401 refreshes and retries profile exactly once', async () => {
  const f = fixture(); await f.manager.login('', '');
  let attempts = 0; f.api.me = async () => { if (++attempts === 1) throw new AuthError(401, 'expired'); return profile; };
  await f.manager.revalidate(); assert.equal(attempts, 2);
  assert.equal(f.calls.filter(c => c[0] === 'refresh').length, 1);
});
test('rejected replacement clears session without refresh loop', async () => {
  const f = fixture(); await f.manager.login('', ''); f.api.me = async () => { throw new AuthError(401, 'expired'); };
  await f.manager.revalidate(); assert.equal(f.calls.filter(c => c[0] === 'refresh').length, 1);
  assert.equal(f.states.at(-1).user, null); assert.equal(f.saved(), null);
});
test('write failure revokes pair and never authenticates', async () => {
  const f = fixture(); f.storage.write = async () => { throw new Error('locked'); };
  await assert.rejects(f.manager.login('', '')); assert.ok(f.states.every(s => s.user === null));
  assert.ok(f.calls.some(c => c[0] === 'logout' && c[1] === pair().refresh_token));
});
test('delete failure prevents refresh request', async () => {
  const f = fixture(); f.save(pair().refresh_token); f.storage.clear = async () => { throw new Error('locked'); };
  await f.manager.restore(); assert.equal(f.calls.length, 0); assert.equal(f.states.at(-1).user, null);
});
test('logout waits for refresh and revokes replacement', async () => {
  const f = fixture(); await f.manager.login('', ''); f.advance();
  await Promise.all([f.manager.revalidate(), f.manager.logout()]);
  assert.deepEqual(f.calls.at(-1), ['logout', pair(1).refresh_token]); assert.equal(f.saved(), null); assert.equal(f.states.at(-1).user, null);
});
test('offline logout reports unconfirmed revocation and clears local session', async () => {
  const f = fixture(); await f.manager.login('', ''); f.api.logout = async () => { throw new Error('offline'); };
  await f.manager.logout(); assert.equal(f.saved(), null); assert.equal(f.states.at(-1).user, null);
  assert.match(f.states.at(-1).message, /revocation could not be confirmed/);
});
test('login sends exact password to token endpoint without cookies or redirects', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 200, json: async () => pair() }));
  await sessionApi.login(' golfer@example.test ', ' fake password ');
  const [url, options] = fetch.mock.calls[0].arguments; assert.equal(url, 'https://example.test/auth/token');
  assert.deepEqual(JSON.parse(options.body), { email: 'golfer@example.test', password: ' fake password ' });
  assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
});
test('API does not expose server error bodies', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 422, json: async () => { throw new Error('secret'); } }));
  await assert.rejects(sessionApi.login('', ''), e => e.status === 422 && !e.message.includes('secret'));
});
test('API rejects wrong-purpose access token', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 200, json: async () => ({ ...pair(), access_token: pair().refresh_token }) }));
  await assert.rejects(sessionApi.login('', ''), /Unexpected authentication response/);
});
test('profile response strips extra fields', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 200, json: async () => ({ ...profile, password_hash: 'fake-hash' }) }));
  assert.deepEqual(await sessionApi.me(pair().access_token), profile);
});

const storageHarness = { os: 'ios', raw: null, saved: null, deleted: 0 };
globalThis.__sessionStorageTest = storageHarness;
const { sessionStorage } = await load('../services/sessionStorage.ts', {
  "import * as SecureStore from 'expo-secure-store';": `const SecureStore = { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1, getItemAsync: async () => globalThis.__sessionStorageTest.raw, setItemAsync: async (key, value, options) => { globalThis.__sessionStorageTest.saved = { key, value, options }; }, deleteItemAsync: async () => { globalThis.__sessionStorageTest.raw = null; globalThis.__sessionStorageTest.deleted++; } };`,
  "import { Platform } from 'react-native';": 'const Platform = { get OS() { return globalThis.__sessionStorageTest.os; } };',
  "import { baseUrl } from './api';": "const baseUrl = () => 'https://example.test';",
  "import { validRefresh } from './sessionApi';": "const validRefresh = value => typeof value === 'string' && /^fiqr_[A-Za-z0-9_-]{43}$/.test(value);",
});
test('native storage persists refresh bound to API with device-only accessibility', async () => {
  storageHarness.os = 'ios'; await sessionStorage.write(pair().refresh_token);
  assert.deepEqual(JSON.parse(storageHarness.saved.value), { server: 'https://example.test', refresh: pair().refresh_token });
  assert.deepEqual(storageHarness.saved.options, { keychainAccessible: 1 });
  storageHarness.raw = storageHarness.saved.value;
  assert.equal(await sessionStorage.read(), pair().refresh_token);
});
test('invalid storage and credentials from a different API are removed, never restored', async () => {
  for (const raw of ['not json', 'null', JSON.stringify({ server: 'https://other.test', refresh: pair().refresh_token }), JSON.stringify({ server: 'https://example.test', refresh: pair().access_token })]) {
    storageHarness.raw = raw; const before = storageHarness.deleted;
    assert.equal(await sessionStorage.read(), null); assert.equal(storageHarness.deleted, before + 1);
  }
});
test('web sessions never touch native or browser persistence', async () => {
  storageHarness.os = 'web'; storageHarness.saved = null; const before = storageHarness.deleted;
  await sessionStorage.write(pair().refresh_token); assert.equal(await sessionStorage.read(), null); await sessionStorage.clear();
  assert.equal(storageHarness.saved, null); assert.equal(storageHarness.deleted, before);
  storageHarness.os = 'ios';
});

test('registration preserves exact password and sends only the backend allowlisted fields', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 201, json: async () => profile }));
  await sessionApi.register(' Test Golfer ', ' golfer@example.test ', ' synthetic password ');
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url, 'https://example.test/auth/register');
  assert.deepEqual(JSON.parse(options.body), { full_name: 'Test Golfer', email: 'golfer@example.test', password: ' synthetic password ' });
});
test('auth transport failures are safe and never automatically retry', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('synthetic-sensitive-transport-detail'); });
  await assert.rejects(sessionApi.refresh(pair().refresh_token), error => !error.message.includes('synthetic-sensitive'));
  assert.equal(fetch.mock.callCount(), 1);
});
test('logout 204 does not attempt JSON parsing', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 204, json: async () => { throw new Error('must not parse'); } }));
  await sessionApi.logout(pair().refresh_token);
});
test('invalid lifetimes fail closed before session installation', async t => {
  let payload;
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, status: 200, json: async () => payload }));
  for (const change of [{ expires_in: 0 }, { expires_in: 901 }, { expires_in: 1.5 }, { refresh_expires_in: -1 }, { refresh_expires_in: 2592001 }, { token_type: 'other' }]) {
    payload = { ...pair(), ...change };
    await assert.rejects(sessionApi.login('golfer@example.test', 'synthetic'), /Unexpected authentication response/);
  }
});
test('storage read failure signs out without contacting token endpoints', async () => {
  const f = fixture(); f.storage.read = async () => { throw new Error('locked'); };
  await f.manager.restore();
  assert.equal(f.calls.length, 0); assert.equal(f.states.at(-1).user, null);
});
test('queued revalidation after logout cannot restore the previous profile', async () => {
  const f = fixture(); await f.manager.login('', '');
  await Promise.all([f.manager.logout(), f.manager.revalidate(), f.manager.revalidate()]);
  assert.equal(f.states.at(-1).user, null); assert.equal(f.saved(), null);
  assert.equal(f.calls.filter(call => call[0] === 'me').length, 1);
});
