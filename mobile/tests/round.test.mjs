import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import ts from 'typescript';
const { outputText } = ts.transpileModule(fs.readFileSync(new URL('../utils/round.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { createRound, parseScore, holeErrors, validateCourseName, previewTotals, finishRound, roundTotals, formatRelativeScore } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

for (const count of [9, 18]) {
  test(`creates ${count} distinct holes and trims course name`, () => {
    const round = createRound('  Pine Valley  ', count);
    assert.equal(round.courseName, 'Pine Valley');
    assert.equal(round.holes.length, count);
    assert.deepEqual(round.holes.map(hole => hole.number), Array.from({ length: count }, (_, i) => i + 1));
    assert.ok(round.holes.every(hole => hole.par === '4' && hole.strokes === '' && hole.putts === ''));
    round.holes[0].par = '3';
    assert.equal(round.holes[1].par, '4');
  });
}

test('validates blank, oversized, and control-character course names', () => {
  for (const name of ['', '   ', 'a'.repeat(101), 'Pine\nValley', 'Pine\u0000Valley']) {
    assert.ok(validateCourseName(name));
    assert.throws(() => createRound(name, 9));
  }
  assert.equal(validateCourseName('St. Andrews – Old Course'), undefined);
  assert.equal(validateCourseName('a'.repeat(100)), undefined);
  assert.throws(() => createRound('Pine Valley', 12));
});

test('score parser rejects negative, fractional, nonnumeric, blank, and oversized values', () => {
  for (const value of ['-1', '1.5', 'abc', '', ' ', ' 4 ', '+4', '1e2', 'Infinity', 'NaN', '99999999999999999999']) assert.equal(parseScore(value, 0, 30), null);
  assert.equal(parseScore('0', 0, 30), 0);
  assert.equal(parseScore('30', 0, 30), 30);
  assert.equal(parseScore('31', 0, 30), null);
});

test('par and stroke bounds and putt/stroke relationship are enforced', () => {
  const hole = { number: 1, par: '4', strokes: '5', putts: '0' };
  assert.deepEqual(holeErrors(hole), {});
  assert.ok(holeErrors({ ...hole, par: '0' }).par);
  assert.ok(holeErrors({ ...hole, par: '7' }).par);
  assert.ok(holeErrors({ ...hole, strokes: '0' }).strokes);
  assert.ok(holeErrors({ ...hole, strokes: '31' }).strokes);
  assert.ok(holeErrors({ ...hole, putts: '-1' }).putts);
  assert.ok(holeErrors({ ...hole, putts: '' }).putts);
  assert.ok(holeErrors({ ...hole, putts: '6' }).putts);
  assert.deepEqual(holeErrors({ ...hole, putts: '5' }), {});
});

test('unplayed holes do not produce a misleading zero score or par deficit', () => {
  assert.deepEqual(previewTotals(createRound('Pine', 9).holes), { strokes: 0, par: 0, putts: 0, scoredHoles: 0, completedHoles: 0, relativeToPar: null });
});

test('running total updates before putts are entered and excludes invalid scores', () => {
  const holes = [
    { number: 1, par: '4', strokes: '5', putts: '2' },
    { number: 2, par: '3', strokes: '2', putts: '' },
    { number: 3, par: '4', strokes: '-1', putts: '1' },
    { number: 4, par: 'abc', strokes: '4', putts: '1' },
  ];
  assert.deepEqual(previewTotals(holes), { strokes: 7, par: 7, putts: 2, scoredHoles: 2, completedHoles: 1, relativeToPar: 0 });
  assert.equal(previewTotals([{ number: 1, par: '4', strokes: '3', putts: '4' }]).completedHoles, 0);
});

test('finish blocks incomplete holes, invalid values, and mismatched structure', () => {
  const draft = createRound('Pine', 9);
  assert.throws(() => finishRound(draft), /hole 1/);
  const filled = { ...draft, holes: draft.holes.map(hole => ({ ...hole, strokes: '4', putts: '2' })) };
  assert.throws(() => finishRound({ ...filled, holes: filled.holes.slice(1) }), /9 or 18/);
  assert.throws(() => finishRound({ ...filled, holeCount: 12 }), /9 or 18/);
  assert.throws(() => finishRound({ ...filled, courseName: '' }));
  assert.throws(() => finishRound({ ...filled, holes: filled.holes.map(hole => hole.number === 3 ? { ...hole, putts: '5' } : hole) }), /hole 3/);
  assert.throws(() => finishRound({ ...filled, holes: filled.holes.map(hole => ({ ...hole, number: 1 })) }), /hole 2/);
});

for (const count of [9, 18]) {
  test(`finishes a ${count}-hole round with numeric scores and correct summary`, () => {
    const draft = createRound('Pine', count);
    draft.holes = draft.holes.map(hole => ({ ...hole, strokes: hole.number === 1 ? '3' : '5', putts: '2' }));
    const round = finishRound(draft);
    const totals = roundTotals(round);
    assert.equal(totals.strokes, 5 * count - 2);
    assert.equal(totals.par, 4 * count);
    assert.equal(totals.putts, 2 * count);
    assert.equal(totals.completedHoles, count);
    assert.equal(totals.relativeToPar, count - 2);
    assert.equal(typeof round.holes[0].strokes, 'number');
    draft.holes[0].strokes = '10';
    assert.equal(round.holes[0].strokes, 3, 'Summary must be independent of editable draft');
  });
}

test('relative score formatting handles unplayed, even, over, and under par', () => {
  assert.equal(formatRelativeScore(null), '—');
  assert.equal(formatRelativeScore(0), 'E');
  assert.equal(formatRelativeScore(2), '+2');
  assert.equal(formatRelativeScore(-2), '-2');
});

test('early finish includes only played holes and their par, retaining planned length', () => {
  for (const count of [9, 18]) {
    const draft = createRound('Pine', count);
    draft.holes[0] = { number: 1, par: '4', strokes: '5', putts: '2' };
    draft.holes[1] = { number: 2, par: '3', strokes: '2', putts: '0' };
    const round = finishRound(draft, true);
    assert.equal(round.holeCount, count);
    assert.equal(round.holes.length, 2);
    assert.deepEqual(roundTotals(round), { strokes: 7, par: 7, putts: 2, scoredHoles: 2, completedHoles: 2, relativeToPar: 0 });
    assert.equal(draft.holes.length, count);
    assert.equal(draft.holes[2].strokes, '');
    assert.throws(() => finishRound(draft)); // Full-round validation is preserved.
  }
});

test('early finish rejects empty rounds, incomplete played scores, and skipped holes', () => {
  const draft = createRound('Pine', 9);
  assert.throws(() => finishRound(draft, true), /at least one/);
  draft.holes[0].strokes = '4';
  assert.throws(() => finishRound(draft, true), /hole 1/);
  draft.holes[0].putts = '5';
  assert.throws(() => finishRound(draft, true), /hole 1/);
  draft.holes[0].putts = '0';
  assert.equal(finishRound(draft, true).holes.length, 1);
  draft.holes[2].strokes = '3'; draft.holes[2].putts = '1';
  assert.throws(() => finishRound(draft, true), /hole 2/);
});

test('ending early with all holes played matches a full round', () => {
  const draft = createRound('Pine', 9);
  draft.holes.forEach(h => { h.strokes = '4'; h.putts = '2'; });
  assert.deepEqual(finishRound(draft, true), finishRound(draft));
});
