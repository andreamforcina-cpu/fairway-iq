import type { SavedRound } from '../services/roundStore';
import type { HoleCount } from '../types/round';
import { roundTotals } from './round';

export type RoundSource = 'local' | 'account';

/** Account callers supply only their scoped library; pending copies are not performance evidence. */
export function selectRoundHistory(history: readonly SavedRound[], source: RoundSource) {
  return history.filter(entry => source === 'local' || !!entry.serverId)
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt) || (a.id === b.id ? 0 : a.id < b.id ? 1 : -1));
}

export function dashboardSummary(history: readonly SavedRound[], holeCount: HoleCount, period: 'latest' | 'recent', source: RoundSource = 'local') {
  const recent = selectRoundHistory(history, source);
  const complete = recent.filter(entry => entry.round.holeCount === holeCount && entry.round.holes.length === holeCount);
  const selected = complete.slice(0, period === 'latest' ? 1 : 5);
  const totals = selected.map(entry => roundTotals(entry.round));
  return {
    recent: recent.slice(0, 5), count: selected.length,
    score: totals.length ? totals.reduce((sum, total) => sum + total.strokes, 0) / totals.length : null,
    putts: totals.length ? totals.reduce((sum, total) => sum + total.putts, 0) / totals.length : null,
  };
}

/** The same last-five complete selection used by Home, with explicit exclusions and window. */
export function performanceSummary(history: readonly SavedRound[], holeCount: HoleCount) {
  const acknowledged = selectRoundHistory(history, 'account');
  const complete = acknowledged.filter(entry => entry.round.holeCount === holeCount && entry.round.holes.length === holeCount);
  const sequence = complete.slice(0, 5);
  return {
    ...dashboardSummary(history, holeCount, 'recent', 'account'),
    sequence,
    completeCount: complete.length,
    partialCount: acknowledged.filter(entry => entry.round.holeCount === holeCount && entry.round.holes.length < holeCount).length,
    pendingCount: history.filter(entry => entry.round.holeCount === holeCount && !entry.serverId).length,
  };
}
