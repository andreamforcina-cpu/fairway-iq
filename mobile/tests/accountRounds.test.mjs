import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function moduleUrl(path, replacements = {}) {
  let source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(from, to);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const utilsUrl = moduleUrl('../utils/round.ts');
const storeUrl = moduleUrl('../services/roundStore.ts', { "'../utils/round'": JSON.stringify(utilsUrl) });
const apiUrl = moduleUrl('../services/roundApi.ts', { "import { baseUrl } from './api';": "const baseUrl = () => 'https://example.test';", "'./roundStore'": JSON.stringify(storeUrl), "'../utils/round'": JSON.stringify(utilsUrl) });
const { createRound, finishRound } = await import(utilsUrl);
const { emptyLibrary, completeRound, decodeLibrary } = await import(storeUrl);
const { createRoundApi, submission, decodeServerRound } = await import(apiUrl);
const { createAccountRoundStore } = await import(moduleUrl('../services/accountRoundStore.ts', { "'./roundStore'": JSON.stringify(storeUrl), "'./roundApi'": JSON.stringify(apiUrl) }));
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const serverId = '33333333-3333-4333-8333-333333333333';
const key = '44444444-4444-4444-8444-444444444444';
function completed(id = key, planned = 9, played = 3) {
  const draft = createRound('Test course', planned);
  draft.holes.slice(0, played).forEach(hole => { hole.strokes = '5'; hole.putts = '2'; });
  return { id, completedAt: '2026-10-16T12:00:00.000Z', round: finishRound(draft, true) };
}
function response(entry = completed()) {
  const { submission_id, course_name, planned_holes, completed_at, holes } = submission(entry);
  return { id: serverId, submission_id, course_name, planned_holes, completed_at, holes, created_at: '2026-10-16T12:00:01Z',
    played_holes: holes.length, status: holes.length === planned_holes ? 'complete' : 'early_finished',
    strokes: holes.length * 5, par: holes.length * 4, putts: holes.length * 2, relative_to_par: holes.length };
}
function fixture() {
  const rows = new Map(), remote = new Map(), requests = [];
  const storage = { getItem: async key => rows.get(key) ?? null, setItem: async (key, raw) => { rows.set(key, raw); } };
  const api = {
    submit: async entry => { requests.push(entry); const ack = { ...entry, serverId }; remote.set(entry.id, ack); return ack; },
    history: async () => ({ entries: [...remote.values()], truncated: false }),
  };
  const store = createAccountRoundStore(storage, 'https://example.test', owner, api);
  return { rows, remote, requests, storage, api, store };
}
test('new account and different API origin never read shared legacy or another account data', async () => {
  const f = fixture(); f.rows.set('fairway-iq.rounds.v1', JSON.stringify({ ...emptyLibrary(), history: [{ ...completed(), id: 'legacy' }] }));
  await f.store.save({ ...emptyLibrary(), draft: createRound('Private draft', 9), history: [completed()] });
  const second = createAccountRoundStore(f.storage, 'https://example.test', other, { ...f.api, history: async () => ({ entries: [], truncated: false }) });
  const otherServer = createAccountRoundStore(f.storage, 'https://other.test', owner, { ...f.api, history: async () => ({ entries: [], truncated: false }) });
  assert.deepEqual(await second.load(), emptyLibrary()); assert.deepEqual(await otherServer.load(), emptyLibrary());
  assert.ok(f.rows.has('fairway-iq.rounds.v1'));
  assert.equal((await f.store.load()).draft.courseName, 'Private draft');
});
test('complete and early round UUID is assigned once and survives storage decoding', () => {
  for (const planned of [9, 18]) for (const played of [1, planned]) {
    const entry = completed(key, planned, played);
    const draft = createRound('Test course', planned);
    draft.holes.slice(0, played).forEach(h => { h.strokes = '5'; h.putts = '2'; });
    const result = completeRound({ ...emptyLibrary(), draft }, entry.completedAt, true, key);
    assert.equal(result.history[0].id, key);
    assert.deepEqual(decodeLibrary(JSON.stringify(result)), result);
    assert.equal(submission(entry).holes.length, played);
  }
});
test('submission ID and exact round are durably saved before the first POST', async () => {
  const f = fixture(); const entry = completed();
  f.api.submit = async incoming => {
    const raw = [...f.rows.values()][0];
    assert.deepEqual(JSON.parse(raw).history, [entry]);
    return { ...incoming, serverId };
  };
  await f.store.save({ ...emptyLibrary(), history: [entry] });
  assert.equal(JSON.parse([...f.rows.values()][0]).history[0].serverId, serverId);
  assert.equal(f.store.notice, '');
});
test('lost success response retains a pending copy and a cold retry uses the same key', async () => {
  const f = fixture(); let attempts = 0;
  const original = f.api.submit;
  f.api.submit = async entry => { const ack = await original(entry); if (++attempts === 1) throw new Error('lost response'); return ack; };
  await f.store.save({ ...emptyLibrary(), history: [completed()] });
  assert.match(f.store.notice, /pending/);
  const fresh = createAccountRoundStore(f.storage, 'https://example.test', owner, f.api);
  const result = await fresh.load();
  assert.equal(result.history.length, 1); assert.equal(f.remote.size, 1);
  assert.equal(result.history[0].serverId, serverId);
  assert.deepEqual(f.requests.map(entry => entry.id), [key, key]);
});
test('offline edits persist without retrying a failed upload for every score change', async () => {
  const f = fixture(); let attempts = 0;
  f.api.submit = async () => { attempts++; throw new Error('offline'); };
  f.api.history = async () => { throw new Error('offline'); };
  await f.store.save({ ...emptyLibrary(), history: [completed()] });
  for (let index = 0; index < 5; index++) await f.store.save({ ...emptyLibrary(), current: index, draft: createRound('Next', 9), history: [completed()] });
  assert.equal(attempts, 1);
  const data = await f.store.load();
  assert.equal(attempts, 2); assert.equal(data.current, 4); assert.equal(data.history.length, 1);
  assert.match(f.store.notice, /unavailable/);
});
test('local write failure prevents any upload and preserves prior storage', async () => {
  const f = fixture(); f.storage.setItem = async () => { throw new Error('disk full'); };
  await assert.rejects(f.store.save({ ...emptyLibrary(), history: [completed()] }));
  assert.equal(f.requests.length, 0); assert.equal(f.rows.size, 0);
});
test('conflicting retry is preserved without replacing acknowledged round data', async () => {
  const f = fixture(); await f.store.save({ ...emptyLibrary(), history: [completed()] });
  const modified = completed(); modified.round.holes[0].strokes = 6;
  await assert.rejects(f.store.save({ ...emptyLibrary(), history: [modified] }), /Conflicting/);
  assert.equal((await f.store.load()).history[0].round.holes[0].strokes, 5);
});
test('stale UI save cannot erase fetched history or acknowledgment', async () => {
  const f = fixture(); const entry = completed();
  await f.store.save({ ...emptyLibrary(), history: [entry] });
  f.remote.set(other, { ...completed(other), serverId: other });
  await f.store.load();
  await f.store.save({ ...emptyLibrary(), draft: createRound('Current', 18), history: [entry] });
  const result = await f.store.load();
  assert.equal(result.history.length, 2); assert.ok(result.history.every(entry => entry.serverId));
  assert.equal(f.requests.length, 1); assert.equal(result.draft.holeCount, 18);
});
test('corrupt account cache is not overwritten or uploaded', async () => {
  const f = fixture(); const cacheKey = `fairway-iq.account-rounds.v1:${encodeURIComponent('https://example.test')}:${owner}`;
  f.rows.set(cacheKey, '{invalid');
  await assert.rejects(f.store.load()); assert.equal(f.rows.get(cacheKey), '{invalid');
  assert.equal(f.requests.length, 0);
});
test('a non-UUID legacy round is never accepted into account storage', async () => {
  const f = fixture(); await assert.rejects(f.store.save({ ...emptyLibrary(), history: [{ ...completed(), id: 'legacy' }] }), /Unowned/);
  assert.equal(f.requests.length, 0); assert.equal(f.rows.size, 0);
});
test('API POST sends only allowlisted fields, bearer header and safe fetch settings', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => response() }));
  const api = createRoundApi(work => work('synthetic-access'));
  const saved = await api.submit(completed());
  assert.equal(saved.serverId, serverId);
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url, 'https://example.test/rounds');
  assert.deepEqual(JSON.parse(options.body), submission(completed()));
  assert.equal(options.headers.Authorization, 'Bearer synthetic-access');
  assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store');
});
test('server extra fields are stripped; inconsistent scores, timestamps and IDs rejected', () => {
  assert.deepEqual(decodeServerRound({ ...response(), owner: 'private', request_hash: 'private' }), { ...completed(), serverId });
  for (const change of [{ strokes: 999 }, { putts: 0 }, { played_holes: 9 }, { status: 'complete' }, { id: 'bad' }, { submission_id: 'bad' }, { completed_at: '2026-10-16' }, { created_at: 1 }, { holes: [] }]) assert.throws(() => decodeServerRound({ ...response(), ...change }));
});
test('a valid but unrelated POST response cannot acknowledge another submission', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => response(completed(other)) }));
  await assert.rejects(createRoundApi(work => work('synthetic')).submit(completed()), /Unexpected submission/);
});
test('API consumes bounded cursor pages and preserves round identity', async t => {
  let page = 0;
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ++page === 1 ? { items: [response()], next_cursor: 'safe+cursor' } : { items: [response(completed(other))], next_cursor: null } }));
  const data = await createRoundApi(work => work('synthetic')).history();
  assert.deepEqual(data.entries.map(entry => entry.id), [key, other]); assert.equal(data.truncated, false);
  assert.equal(fetch.mock.calls[1].arguments[0], 'https://example.test/rounds?limit=100&cursor=safe%2Bcursor');
});
test('API rejects looping, empty cursor pages and oversized pages', async t => {
  let data;
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => data }));
  for (const value of [{ items: [], next_cursor: 'loop' }, { items: [response()], next_cursor: 'loop' }, { items: Array(101).fill(response()), next_cursor: null }, { items: [], next_cursor: 5 }]) {
    data = value; await assert.rejects(createRoundApi(work => work('synthetic')).history());
  }
});
test('API hides server bodies and transport details with no transport retry', async t => {
  let mode = 'server';
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    if (mode === 'transport') throw new Error('private transport details');
    return { ok: false, status: 409, json: async () => { throw new Error('private body'); } };
  });
  await assert.rejects(createRoundApi(work => work('synthetic')).submit(completed()), error => error.status === 409 && !error.message.includes('private'));
  mode = 'transport'; await assert.rejects(createRoundApi(work => work('synthetic')).submit(completed()), error => error.status === 0 && !error.message.includes('private'));
  assert.equal(fetch.mock.callCount(), 2);
});

test('account completion can evict acknowledged cache entries but never pending copies', () => {
  const draft = createRound('New round', 9); draft.holes[0].strokes = '4'; draft.holes[0].putts = '0';
  const entries = Array.from({ length: 1000 }, (_, index) => ({ ...completed(`00000000-0000-4000-8000-${String(index).padStart(12, '0')}`), serverId }));
  const full = { ...emptyLibrary(), history: entries, draft };
  const result = completeRound(full, '2026-10-16T13:00:00Z', true, key);
  assert.equal(result.history.length, 1000); assert.equal(result.history[0].id, key);
  assert.equal(full.history.length, 1000); assert.equal(full.draft, draft);
  assert.throws(() => completeRound({ ...full, history: entries.map(({ serverId, ...entry }) => entry) }, '2026-10-16T13:00:00Z', true, key), /full/);
});
test('history refresh errors and truncation remain visible after a draft autosave', async () => {
  const f = fixture(); f.api.history = async () => { throw new Error('offline'); };
  await f.store.load(); await f.store.save({ ...emptyLibrary(), draft: createRound('Draft', 9) });
  assert.match(f.store.notice, /unavailable/);
  f.api.history = async () => ({ entries: [], truncated: true });
  await f.store.load(); await f.store.save({ ...emptyLibrary(), draft: createRound('Draft', 9) });
  assert.match(f.store.notice, /1,000/);
});
test('same-key concurrent saves serialize and send a single acknowledged submission', async () => {
  const f = fixture(); const snapshot = { ...emptyLibrary(), history: [completed()] };
  await Promise.all([f.store.save(snapshot), f.store.save(snapshot), f.store.save(snapshot)]);
  assert.equal(f.requests.length, 1); assert.equal((await f.store.load()).history.length, 1);
});
test('Unicode invisible/control course names are rejected before submission', () => {
  for (const course of ['Test\u200bCourse', 'Test\u0085Course', 'Test\ud800Course']) assert.throws(() => createRound(course, 9));
});

test('explicit save retry uploads the durable current snapshot without reloading an older draft', async () => {
  const f = fixture(); let fail = true;
  const submit = f.api.submit;
  f.api.submit = async entry => { if (fail) throw new Error('offline'); return submit(entry); };
  const snapshot = { ...emptyLibrary(), history: [completed()] };
  await f.store.save(snapshot);
  assert.match(f.store.notice, /pending/);
  fail = false;
  const saved = await f.store.save(snapshot, true);
  assert.equal(saved.draft, null); assert.equal(saved.history[0].serverId, serverId);
  assert.equal(f.requests.length, 1); assert.equal(f.store.notice, '');
});

test('server throttling retains pending scores and explicit retry keeps the same submission', async () => {
  const f = fixture(); const attempted = [];
  const submit = f.api.submit;
  f.api.submit = async entry => {
    attempted.push(submission(entry));
    if (attempted.length === 1) throw Object.assign(new Error('rate limited'), { status: 429 });
    return submit(entry);
  };
  const snapshot = { ...emptyLibrary(), history: [completed()] };
  const pending = await f.store.save(snapshot);
  assert.equal(pending.history[0].serverId, undefined);
  assert.match(f.store.notice, /pending/);
  const saved = await f.store.save(snapshot, true);
  assert.equal(saved.history[0].serverId, serverId);
  assert.deepEqual(attempted[0], attempted[1]);
  assert.equal(f.remote.size, 1);
});
