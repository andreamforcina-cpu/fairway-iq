import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Native API doubles exercise effect races; these are not device/rendering tests.
const h = { effects: [], updates: [], values: [], animations: [], subscription: null, resolve: null, removed: false };
globalThis.__motionHarness = h;
async function load(path) {
  let source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  source = source.replace(/import \{[^}]+\} from 'react';/, `const useEffect = fn => globalThis.__motionHarness.effects.push(fn); const useState = initial => [typeof initial === 'function' ? initial() : initial, value => globalThis.__motionHarness.updates.push(value)];`);
  source = source.replace(/import \{[^}]+\} from 'react-native';/, `
    const AccessibilityInfo = { addEventListener: (_, fn) => { globalThis.__motionHarness.subscription = fn; return { remove: () => { globalThis.__motionHarness.removed = true; } }; }, isReduceMotionEnabled: () => new Promise(resolve => { globalThis.__motionHarness.resolve = resolve; }) };
    const Animated = { Value: class { constructor(value) { this.value = value; } setValue(value) { this.value = value; globalThis.__motionHarness.values.push(value); } }, timing: () => { const animation = { started: false, stopped: false, start() { this.started = true; }, stop() { this.stopped = true; } }; globalThis.__motionHarness.animations.push(animation); return animation; } };
    const Easing = { out: value => value, cubic: 'cubic' };
  `);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { useReducedMotion } = await load('../hooks/useReducedMotion.ts');
const { useEntrance } = await load('../hooks/useEntrance.ts');
function reset() { Object.assign(h, { effects: [], updates: [], values: [], animations: [], subscription: null, resolve: null, removed: false }); }
test('new reduced-motion event takes precedence over stale initial native query', async () => {
  reset(); assert.equal(useReducedMotion(), true); const cleanup = h.effects[0]();
  h.subscription(true); h.resolve(false); await Promise.resolve();
  assert.deepEqual(h.updates, [true]); cleanup(); assert.equal(h.removed, true);
});
test('entrance never starts motion after a newer reduce-motion event', async () => {
  reset(); useEntrance(); const cleanup = h.effects[0]();
  h.subscription(true); h.resolve(false); await Promise.resolve();
  assert.equal(h.animations.length, 0); assert.equal(h.values.at(-1), 1);
  cleanup(); assert.equal(h.removed, true);
});
test('entrance stops active animation when motion is disabled', async () => {
  reset(); useEntrance(); const cleanup = h.effects[0](); h.resolve(false); await Promise.resolve();
  assert.equal(h.animations[0].started, true);
  h.subscription(true); assert.equal(h.animations[0].stopped, true); assert.equal(h.values.at(-1), 1); cleanup();
});
test('late preference query cannot update or animate after unmount', async () => {
  reset(); useReducedMotion(); const cleanup = h.effects[0](); cleanup(); h.resolve(false); await Promise.resolve(); assert.deepEqual(h.updates, []);
  reset(); useEntrance(); const stop = h.effects[0](); stop(); h.resolve(false); await Promise.resolve(); assert.equal(h.animations.length, 0);
});
