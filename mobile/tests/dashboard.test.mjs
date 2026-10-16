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
const { dashboardSummary } = await import(moduleUrl('../utils/dashboard.ts', { "'./round'": JSON.stringify(moduleUrl('../utils/round.ts')) }));
function entry(id, planned = 9, played = planned, strokes = 5, putts = 2) {
  return { id: String(id), completedAt: `2026-10-${String(id).padStart(2, '0')}T12:00:00Z`, round: { courseName: 'Test course', holeCount: planned, holes: Array.from({ length: played }, (_, index) => ({ number: index + 1, par: 4, strokes, putts })) } };
}
test('empty history has absent averages rather than zero or sample scores', () => {
  assert.deepEqual(dashboardSummary([], 9, 'recent'), { recent: [], count: 0, score: null, putts: null });
});
test('nine/eighteen-hole rounds are never mixed and partials remain visible only in recent list', () => {
  const history = [entry(1), entry(2, 18), entry(3, 9, 3)];
  const nine = dashboardSummary(history, 9, 'recent');
  assert.equal(nine.count, 1); assert.equal(nine.score, 45); assert.equal(nine.putts, 18);
  assert.deepEqual(nine.recent.map(e => e.id), ['3', '2', '1']);
  const eighteen = dashboardSummary(history, 18, 'recent');
  assert.equal(eighteen.score, 90); assert.equal(eighteen.putts, 36);
});
test('partial-only history does not fabricate a complete round average', () => {
  const result = dashboardSummary([entry(1, 18, 9)], 9, 'latest');
  assert.equal(result.count, 0); assert.equal(result.score, null); assert.equal(result.recent.length, 1);
});
test('latest selects most recent complete round, not most recent partial', () => {
  const result = dashboardSummary([entry(2, 9, 9, 4, 1), entry(3, 9, 2), entry(1)], 9, 'latest');
  assert.equal(result.count, 1); assert.equal(result.score, 36); assert.equal(result.putts, 9);
});
test('recent averages last five complete matching rounds without changing stored history', () => {
  const history = [entry(1, 9, 9, 10), ...[2, 3, 4, 5, 6].map(id => entry(id, 9, 9, id, id - 1)), entry(7, 18), entry(8, 9, 2)];
  const original = JSON.stringify(history);
  const result = dashboardSummary(history, 9, 'recent');
  assert.equal(result.count, 5); assert.equal(result.score, 36); assert.equal(result.putts, 27);
  assert.equal(result.recent.length, 5); assert.equal(JSON.stringify(history), original);
});
test('averages preserve fractions and genuine zero putts', () => {
  const result = dashboardSummary([entry(1, 9, 9, 4, 0), entry(2, 9, 9, 5, 0)], 9, 'recent');
  assert.equal(result.score, 40.5); assert.equal(result.putts, 0);
});
