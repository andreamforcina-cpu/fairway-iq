import type { HoleCount, HoleDraft, HoleField, HoleScore, Round, RoundDraft, ScoreTotals } from '../types/round';

export function validateCourseName(value: string): string | undefined {
  if (!value.trim()) return 'Enter a golf course name.';
  if (value.trim().length > 100) return 'Use 100 characters or fewer.';
  if (/[\u0000-\u001f\u007f]/.test(value)) return 'Use a single line without control characters.';
  return undefined;
}
export function parseScore(value: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= min && number <= max ? number : null;
}
export function createRound(courseName: string, holeCount: HoleCount): RoundDraft {
  const error = validateCourseName(courseName);
  if (error) throw new Error(error);
  if (holeCount !== 9 && holeCount !== 18) throw new Error('Select 9 or 18 holes.');
  return { courseName: courseName.trim(), holeCount, holes: Array.from({ length: holeCount }, (_, index) => ({ number: index + 1, par: '4', strokes: '', putts: '' })) };
}
export function holeErrors(hole: HoleDraft): Partial<Record<HoleField, string>> {
  const errors: Partial<Record<HoleField, string>> = {};
  const par = parseScore(hole.par, 1, 6);
  const strokes = parseScore(hole.strokes, 1, 30);
  const putts = parseScore(hole.putts, 0, 30);
  if (par === null) errors.par = 'Par must be a whole number from 1 to 6.';
  if (strokes === null) errors.strokes = 'Strokes must be a whole number from 1 to 30.';
  if (putts === null) errors.putts = 'Putts must be a whole number from 0 to 30.';
  else if (strokes !== null && putts > strokes) errors.putts = 'Putts cannot exceed strokes.';
  return errors;
}
export function previewTotals(holes: HoleDraft[]): ScoreTotals {
  let strokes = 0, par = 0, putts = 0, scoredHoles = 0, completedHoles = 0;
  for (const hole of holes) {
    const holePar = parseScore(hole.par, 1, 6);
    const holeStrokes = parseScore(hole.strokes, 1, 30);
    const holePutts = parseScore(hole.putts, 0, 30);
    if (holePar !== null && holeStrokes !== null) {
      strokes += holeStrokes;
      par += holePar;
      scoredHoles++;
      if (holePutts !== null && holePutts <= holeStrokes) { putts += holePutts; completedHoles++; }
    }
  }
  return { strokes, par, putts, scoredHoles, completedHoles, relativeToPar: scoredHoles ? strokes - par : null };
}
/** Last hole with score input; default par alone does not mean a hole was played. */
export function playedHoleCount(draft: RoundDraft): number {
  return draft.holes.reduce((last, hole, index) => hole.strokes !== '' || hole.putts !== '' ? index + 1 : last, 0);
}
export function finishRound(draft: RoundDraft, allowPartial = false): Round {
  const error = validateCourseName(draft.courseName);
  if (error) throw new Error(error);
  if ((draft.holeCount !== 9 && draft.holeCount !== 18) || draft.holes.length !== draft.holeCount) throw new Error('Round must contain 9 or 18 holes.');
  const invalidSequence = draft.holes.findIndex((hole, index) => hole.number !== index + 1);
  if (invalidSequence !== -1) throw new Error(`Invalid sequence for hole ${invalidSequence + 1}.`);
  const count = allowPartial ? playedHoleCount(draft) : draft.holeCount;
  if (!count) throw new Error('Complete at least one hole before finishing.');
  const holes: HoleScore[] = draft.holes.slice(0, count).map((hole, index) => {
    if (hole.number !== index + 1 || Object.keys(holeErrors(hole)).length) throw new Error(`Complete valid scores for hole ${index + 1}.`);
    return { number: hole.number, par: Number(hole.par), strokes: Number(hole.strokes), putts: Number(hole.putts) };
  });
  return { courseName: draft.courseName.trim(), holeCount: draft.holeCount, holes };
}
export function roundTotals(round: Round): ScoreTotals {
  return previewTotals(round.holes.map(hole => ({ number: hole.number, par: String(hole.par), strokes: String(hole.strokes), putts: String(hole.putts) })));
}
export function formatRelativeScore(value: number | null): string {
  return value === null ? '—' : value === 0 ? 'E' : value > 0 ? `+${value}` : String(value);
}
