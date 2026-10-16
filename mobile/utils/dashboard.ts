import type { SavedRound } from '../services/roundStore';
import type { HoleCount } from '../types/round';
import { roundTotals } from './round';

export function dashboardSummary(history: readonly SavedRound[], holeCount: HoleCount, period: 'latest' | 'recent') {
  const recent = [...history].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  const complete = recent.filter(entry => entry.round.holeCount === holeCount && entry.round.holes.length === holeCount);
  const selected = complete.slice(0, period === 'latest' ? 1 : 5);
  const totals = selected.map(entry => roundTotals(entry.round));
  return {
    recent: recent.slice(0, 5), count: selected.length,
    score: totals.length ? totals.reduce((sum, total) => sum + total.strokes, 0) / totals.length : null,
    putts: totals.length ? totals.reduce((sum, total) => sum + total.putts, 0) / totals.length : null,
  };
}
