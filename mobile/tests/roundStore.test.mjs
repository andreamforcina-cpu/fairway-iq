import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function moduleUrl(path, replacements = {}) {
  let source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replace(from, to);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const roundUrl = moduleUrl('../utils/round.ts');
const { createRound, finishRound } = await import(roundUrl);
const { decodeLibrary, emptyLibrary, createRoundStore, completeRound } = await import(moduleUrl('../services/roundStore.ts', { "'../utils/round'": JSON.stringify(roundUrl) }));
const completed = () => finishRound({ ...createRound('Pine', 9), holes: createRound('Pine', 9).holes.map(h => ({ ...h, strokes: '4', putts: '2' })) });
const history = () => [{ id: 'round-1', completedAt: '2026-10-14T20:00:00.000Z', round: completed() }];
test('new install is empty; partial draft, active hole and history survive reload', () => {
  assert.deepEqual(decodeLibrary(null), emptyLibrary());
  const library = { version: 1, current: 2, draft: createRound('Pine', 9), history: history() };
  library.draft.holes[0].strokes = '5'; library.draft.holes[1].putts = 'x';
  assert.deepEqual(decodeLibrary(JSON.stringify(library)), library);
});
test('rejects corrupt, unsupported and structurally invalid stored data', () => {
  const active = { ...emptyLibrary(), draft: createRound('Pine', 9) };
  for (const value of ['{', 'null', JSON.stringify({ ...active, version: 2 }), JSON.stringify({ ...active, current: 9 }), JSON.stringify({ ...active, draft: { ...active.draft, holes: [] } }), JSON.stringify({ ...active, draft: { ...active.draft, courseName: '\n' } }), JSON.stringify({ ...active, history: [...history(), ...history()] })]) assert.throws(() => decodeLibrary(value));
  assert.throws(() => decodeLibrary(' '.repeat(5000001)));
});
test('saved completed scores must be valid numbers with sequential holes', () => {
  for (const change of [r => { r.holes[0].strokes = '4'; }, r => { r.holes[0].putts = 5; }, r => { r.holes[0].number = 2; }, r => { r.holes[0].par = 7; }]) {
    const entries = history(); change(entries[0].round);
    assert.throws(() => decodeLibrary(JSON.stringify({ ...emptyLibrary(), history: entries })));
  }
});
test('completion stores history and clears the draft in one durable snapshot', async () => {
  let raw = null;
  const store = createRoundStore({ getItem: async () => raw, setItem: async (_, value) => { raw = value; } });
  await store.save({ ...emptyLibrary(), draft: createRound('Pine', 9) });
  await store.save({ ...emptyLibrary(), history: history() });
  assert.deepEqual(await store.load(), { ...emptyLibrary(), history: history() });
});
test('writes serialize, snapshot inputs, and recover after storage failure', async () => {
  const written = []; let release; let calls = 0;
  const store = createRoundStore({ getItem: async () => null, setItem: async (_, raw) => {
    calls++;
    if (calls === 1) await new Promise(resolve => { release = resolve; });
    if (calls === 2) throw new Error('disk full');
    written.push(JSON.parse(raw));
  } });
  const first = { ...emptyLibrary(), draft: createRound('First', 9) };
  const a = store.save(first); first.draft.courseName = 'Mutated';
  const b = store.save(emptyLibrary()); const rejected = assert.rejects(b, /disk full/);
  const c = store.save({ ...emptyLibrary(), history: history() });
  await Promise.resolve(); assert.equal(calls, 1);
  release(); await Promise.all([a, rejected, c]);
  assert.equal(written[0].draft.courseName, 'First'); assert.equal(written[1].history.length, 1);
});
test('corrupt data is surfaced without overwriting storage', async () => {
  let writes = 0;
  const store = createRoundStore({ getItem: async () => '{bad', setItem: async () => { writes++; } });
  await assert.rejects(store.load()); assert.equal(writes, 0);
});

test('finishing preserves earlier history, clears draft, and rejects incomplete rounds', () => {
  const entries = history();
  const draft = createRound('New course', 18);
  assert.throws(() => completeRound({ ...emptyLibrary(), draft }, entries[0].completedAt));
  draft.holes.forEach(h => { h.strokes = '4'; h.putts = '2'; });
  const before = { version: 1, current: 17, draft, history: entries };
  const after = completeRound(before, entries[0].completedAt);
  assert.equal(after.draft, null); assert.equal(after.current, 0);
  assert.equal(after.history.length, 2);
  assert.notEqual(after.history[0].id, after.history[1].id);
  assert.equal(after.history[0].round.holeCount, 18);
  assert.equal(before.draft, draft);
  assert.deepEqual(decodeLibrary(JSON.stringify(after)), after);
  assert.throws(() => completeRound(after, entries[0].completedAt));
});

test('partial scorecards survive persistence without filling unplayed holes', async () => {
  let raw = null;
  const store = createRoundStore({ getItem: async () => raw, setItem: async (_, value) => { raw = value; } });
  const draft = createRound('Short outing', 9);
  draft.holes.slice(0, 3).forEach(h => { h.strokes = '4'; h.putts = '2'; });
  const library = completeRound({ ...emptyLibrary(), draft, history: history() }, '2026-10-14T21:00:00Z', true);
  await store.save(library);
  const restored = await store.load();
  assert.equal(restored.draft, null);
  assert.equal(restored.history.length, 2);
  assert.equal(restored.history[0].round.holes.length, 3);
  assert.equal(restored.history[0].round.holeCount, 9);
  assert.deepEqual(restored.history[1], history()[0]);
  assert.deepEqual(restored, library);
});

test('stored history rejects zero played holes and holes beyond planned length', () => {
  for (const holes of [[], [...completed().holes, { number: 10, par: 4, strokes: 4, putts: 2 }]]) {
    const entries = history(); entries[0].round.holes = holes;
    assert.throws(() => decodeLibrary(JSON.stringify({ ...emptyLibrary(), history: entries })));
  }
});

test('a pending history read completes before a later save starts', async () => {
  const events = []; let release;
  const store = createRoundStore({
    getItem: async () => { events.push('read started'); await new Promise(resolve => { release = resolve; }); events.push('read finished'); return null; },
    setItem: async () => { events.push('write'); },
  });
  const read = store.load(); await Promise.resolve();
  const write = store.save(emptyLibrary()); await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(events, ['read started']);
  release(); await Promise.all([read, write]);
  assert.deepEqual(events, ['read started', 'read finished', 'write']);
});
test('read failure does not poison subsequent saves or reads', async () => {
  let raw = null, fail = true;
  const store = createRoundStore({ getItem: async () => { if (fail) { fail = false; throw new Error('read unavailable'); } return raw; }, setItem: async (_, value) => { raw = value; } });
  await assert.rejects(store.load(), /read unavailable/);
  await store.save({ ...emptyLibrary(), history: history() });
  assert.deepEqual((await store.load()).history, history());
});
test('completion rejects invalid dates and the 1000-round limit without mutating draft', () => {
  const draft = createRound('Boundary', 9); draft.holes[0].strokes = '4'; draft.holes[0].putts = '0';
  const full = { ...emptyLibrary(), draft, history: Array.from({ length: 1000 }, (_, i) => ({ ...history()[0], id: String(i) })) };
  const before = JSON.stringify(full);
  assert.throws(() => completeRound(full, '2026-10-15T12:00:00Z', true), /full/);
  assert.equal(JSON.stringify(full), before);
  assert.throws(() => completeRound({ ...emptyLibrary(), draft }, 'invalid-date', true), /date/);
});
test('every early-finish length survives round-trip for 9 and 18 holes', () => {
  for (const planned of [9, 18]) for (let count = 1; count <= planned; count++) {
    const draft = createRound('Length boundary', planned);
    draft.holes.slice(0, count).forEach(h => { h.strokes = '5'; h.putts = '0'; });
    const saved = completeRound({ ...emptyLibrary(), draft }, '2026-10-15T12:00:00Z', true);
    const restored = decodeLibrary(JSON.stringify(saved));
    assert.equal(restored.history[0].round.holes.length, count);
    assert.equal(restored.history[0].round.holeCount, planned);
    assert.deepEqual(restored, saved);
  }
});
