import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function moduleUrl(path, replacements = {}) {
  let source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(from, to);
  return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString('base64')}`;
}
const utils = moduleUrl('../utils/round.ts');
const storage = moduleUrl('../services/roundStore.ts', { "'../utils/round'": JSON.stringify(utils) });
const { emptyLibrary } = await import(storage);
const { createRound } = await import(utils);
const { useRoundLibrary } = await import(moduleUrl('../hooks/useRoundLibrary.ts', {
  "import { useCallback, useEffect, useRef, useState } from 'react';": `const useState = (...args) => globalThis.__roundHook.state(...args); const useRef = value => globalThis.__roundHook.ref(value); const useCallback = (fn, deps) => globalThis.__roundHook.callback(fn, deps); const useEffect = (fn, deps) => globalThis.__roundHook.effect(fn, deps);`,
  "import { useFocusEffect } from 'expo-router';": 'const useFocusEffect = fn => globalThis.__roundHook.effect(fn, [fn]);',
  "import { useSession } from './useSession';": 'const useSession = () => ({ rounds: globalThis.__roundHook.store });',
  "'../services/roundStore'": JSON.stringify(storage),
}));
function harness(store) {
  const slots = []; let cursor = 0; const pending = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const h = {
    store, dirty: true, result: null,
    state(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, next => {
        const previous = slots[index].value;
        const value = typeof next === 'function' ? next(previous) : next;
        if (!Object.is(previous, value)) { slots[index].value = value; h.dirty = true; }
      }];
    },
    ref(value) { const index = cursor++; return (slots[index] ??= { current: value }); },
    callback(fn, deps) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) slots[index] = { value: fn, deps };
      return slots[index].value;
    },
    effect(fn, deps) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].deps, deps)) {
        const previous = slots[index]; slots[index] = { deps };
        pending.push(() => { previous?.cleanup?.(); slots[index].cleanup = fn(); });
      }
    },
    render() { globalThis.__roundHook = h; h.dirty = false; cursor = 0; h.result = useRoundLibrary(); while (pending.length) pending.shift()(); },
    async flush() {
      for (let attempt = 0; attempt < 30; attempt++) {
        if (h.dirty) h.render();
        await new Promise(resolve => setImmediate(resolve));
        if (!h.dirty) return;
      }
      assert.fail('Hook did not settle');
    },
  };
  return h;
}
test('failed initial read never overwrites existing storage', async () => {
  let writes = 0;
  const h = harness({ load: async () => { throw new Error('corrupt'); }, save: async () => { writes++; } });
  await h.flush();
  assert.equal(h.result.library, null); assert.equal(writes, 0); assert.match(h.result.message, /Unable to read/);
});
test('retry saving writes current state without reloading an older snapshot', async () => {
  let reads = 0, fail = false; const saved = [];
  const h = harness({ load: async () => { reads++; return emptyLibrary(); }, save: async (library, retry) => {
    if (fail) throw new Error('disk full'); saved.push({ library, retry });
  } });
  await h.flush(); fail = true;
  const current = { ...emptyLibrary(), draft: createRound('Unsaved course', 9) };
  h.result.setLibrary(current); await h.flush();
  assert.match(h.result.message, /could not be saved/);
  fail = false; h.result.retrySave(); await h.flush();
  assert.equal(reads, 1); assert.equal(saved.at(-1).retry, true);
  assert.equal(saved.at(-1).library.draft.courseName, 'Unsaved course');
});
test('refresh preserves unsaved input when local persistence has failed', async () => {
  let fail = false;
  const h = harness({ load: async () => emptyLibrary(), save: async () => { if (fail) throw new Error('disk full'); } });
  await h.flush(); fail = true;
  h.result.setLibrary({ ...emptyLibrary(), draft: createRound('Keep these scores', 18), current: 3 });
  await h.flush(); h.result.load(); await h.flush();
  assert.equal(h.result.library.draft.courseName, 'Keep these scores'); assert.equal(h.result.library.current, 3);
});
test('server acknowledgment updates row status without an infinite save loop', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const completed = { id, completedAt: '2026-10-16T12:00:00Z', round: { courseName: 'Test', holeCount: 9, holes: [{ number: 1, par: 4, strokes: 5, putts: 2 }] } };
  let writes = 0;
  const h = harness({ load: async () => ({ ...emptyLibrary(), history: [completed] }), save: async library => {
    writes++; return { ...library, history: library.history.map(entry => ({ ...entry, serverId: id })) };
  } });
  await h.flush(); assert.equal(h.result.library.history[0].serverId, id); assert.equal(writes, 2);
});
