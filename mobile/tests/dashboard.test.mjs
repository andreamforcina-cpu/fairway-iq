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
const { dashboardSummary, performanceSummary } = await import(moduleUrl('../utils/dashboard.ts', { "'./round'": JSON.stringify(moduleUrl('../utils/round.ts')) }));
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


const synced = (id, planned = 9, played = planned, strokes = 5, putts = 2) => ({ ...entry(id, planned, played, strokes, putts), serverId: `server-${id}` });
test('account averages exclude pending rounds while local preview calculations remain available', () => {
  const history = [synced(1, 9, 9, 4, 1), entry(2, 9, 9, 10, 3)];
  const account = dashboardSummary(history, 9, 'recent', 'account');
  assert.equal(account.score, 36); assert.equal(account.count, 1); assert.deepEqual(account.recent.map(e => e.id), ['1']);
  assert.equal(dashboardSummary(history, 9, 'recent', 'local').score, 63);
});
test('acknowledgment admits a pending round once and reconciles Home with Analytics', () => {
  const history = [synced(1, 9, 9, 5, 2), entry(2, 9, 9, 4, 1)];
  assert.equal(performanceSummary(history, 9).count, 1);
  history[1].serverId = 'confirmed';
  const analytics = performanceSummary(history, 9);
  const home = dashboardSummary(history, 9, 'recent', 'account');
  assert.equal(analytics.count, 2); assert.equal(analytics.score, 40.5); assert.equal(analytics.putts, 13.5);
  assert.equal(home.score, analytics.score); assert.equal(home.putts, analytics.putts);
  assert.equal(analytics.pendingCount, 0);
});
test('analytics separates synced partials, pending, other lengths and legacy preview from averages', () => {
  const history = [synced(1), synced(2, 18), synced(3, 9, 3), entry(4, 9, 3), entry(5), entry(6, 18)];
  const nine = performanceSummary(history, 9);
  assert.equal(nine.count, 1); assert.equal(nine.partialCount, 1); assert.equal(nine.pendingCount, 2);
  assert.deepEqual(nine.sequence.map(e => e.id), ['1']);
  const eighteen = performanceSummary(history, 18);
  assert.equal(eighteen.count, 1); assert.equal(eighteen.pendingCount, 1); assert.equal(eighteen.score, 90);
});
test('analytics returns absent values for empty or pending/partial-only histories', () => {
  for (const history of [[], [entry(1)], [synced(2, 9, 3)]]) {
    const result = performanceSummary(history, 9);
    assert.equal(result.count, 0); assert.equal(result.score, null); assert.equal(result.putts, null);
    assert.deepEqual(result.sequence, []);
  }
});
test('one complete record has n=1, genuine zero putts and no invented statistics', () => {
  const result = performanceSummary([synced(1, 9, 9, 4, 0)], 9);
  assert.equal(result.count, 1); assert.equal(result.score, 36); assert.equal(result.putts, 0);
  for (const field of ['handicap', 'strokesGained', 'penalties', 'fairways', 'greens', 'improvement']) assert.equal(field in result, false);
});
test('last-five window is bounded independently of eligible cache count', () => {
  const history = Array.from({ length: 1000 }, (_, i) => ({ ...synced(1), id: String(i).padStart(4, '0') }));
  const before = JSON.stringify(history);
  const result = performanceSummary(history, 9);
  assert.equal(result.count, 5); assert.equal(result.completeCount, 1000); assert.equal(result.sequence.length, 5);
  assert.deepEqual(result.sequence.map(e => e.id), ['0999', '0998', '0997', '0996', '0995']);
  assert.equal(JSON.stringify(history), before);
});
test('timestamp ties use deterministic IDs and newest completion timestamps win without mutating input', () => {
  const first = synced(1), second = { ...synced(2), completedAt: first.completedAt };
  const result = performanceSummary([first, second, synced(3)], 9);
  assert.deepEqual(result.sequence.map(e => e.id), ['3', '2', '1']);
});
test('separate account snapshots do not retain prior statistics or pending counts', () => {
  assert.equal(performanceSummary([synced(1), entry(2)], 9).score, 45);
  const other = performanceSummary([], 9);
  assert.equal(other.score, null); assert.equal(other.pendingCount, 0); assert.equal(other.completeCount, 0);
});
