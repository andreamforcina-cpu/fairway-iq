import { baseUrl } from './api';
import { decodeLibrary, emptyLibrary, isUuid } from './roundStore';
import type { SavedRound } from './roundStore';
import { roundTotals } from '../utils/round';

export class RoundApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
type Authorize = <T>(work: (access: string) => Promise<T>) => Promise<T>;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const timestamp = (value: unknown): value is string => typeof value === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
export function submission(entry: SavedRound) {
  if (!isUuid(entry.id) || !timestamp(entry.completedAt)) throw new Error('Invalid account round.');
  const validated = decodeLibrary(JSON.stringify({ ...emptyLibrary(), history: [entry] })).history[0];
  return { submission_id: validated.id, course_name: validated.round.courseName, planned_holes: validated.round.holeCount,
    completed_at: new Date(validated.completedAt).toISOString(), holes: validated.round.holes };
}
export function decodeServerRound(value: unknown): SavedRound {
  if (!object(value) || !isUuid(value.id) || !isUuid(value.submission_id) || !timestamp(value.completed_at) || !timestamp(value.created_at)) throw new Error('Unexpected round response.');
  const entry = decodeLibrary(JSON.stringify({ ...emptyLibrary(), history: [{ id: value.submission_id, serverId: value.id,
    completedAt: value.completed_at, round: { courseName: value.course_name, holeCount: value.planned_holes, holes: value.holes } }] })).history[0];
  const totals = roundTotals(entry.round);
  if (value.played_holes !== entry.round.holes.length || value.status !== (value.played_holes === value.planned_holes ? 'complete' : 'early_finished')
      || value.strokes !== totals.strokes || value.par !== totals.par || value.putts !== totals.putts || value.relative_to_par !== totals.relativeToPar) throw new Error('Unexpected round totals.');
  return entry;
}
/** Transport is bound to a fixed API origin and an account-checked session operation. */
export function createRoundApi(authorize: Authorize, server = baseUrl()) {
  async function request(path: string, body?: object): Promise<unknown> {
    return authorize(async access => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`${server}${path}`, {
          method: body ? 'POST' : 'GET', signal: controller.signal, credentials: 'omit', redirect: 'error', cache: 'no-store',
          headers: { Accept: 'application/json', Authorization: `Bearer ${access}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (!response.ok) throw new RoundApiError(response.status,
          response.status === 401 ? 'Please log in again to sync rounds.' : response.status === 409 ? 'This submission conflicts with an existing round. Your local copy has been kept.' :
            response.status === 422 ? 'The round could not be accepted. Your local copy has been kept.' : 'Round sync is temporarily unavailable. Your local copy has been kept.');
        return await response.json();
      } catch (error) {
        if (error instanceof RoundApiError) throw error;
        throw new RoundApiError(0, 'Unable to sync rounds. Check your connection and retry.');
      } finally { clearTimeout(timer); }
    });
  }
  return {
    async submit(entry: SavedRound): Promise<SavedRound> {
      const body = submission(entry);
      const result = decodeServerRound(await request('/rounds', body));
      if (JSON.stringify(submission(result)) !== JSON.stringify(body)) throw new Error('Unexpected submission response.');
      return result;
    },
    async history(): Promise<{ entries: SavedRound[]; truncated: boolean }> {
      const entries: SavedRound[] = [], ids = new Set<string>(), cursors = new Set<string>();
      let cursor: string | null = null;
      do {
        const data = await request('/rounds?limit=100' + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''));
        if (!object(data) || !Array.isArray(data.items) || data.items.length > 100 || !(data.next_cursor === null || (typeof data.next_cursor === 'string' && data.next_cursor.length > 0 && data.next_cursor.length <= 160))) throw new Error('Unexpected history response.');
        for (const item of data.items) {
          const entry = decodeServerRound(item);
          if (ids.has(entry.id)) throw new Error('Duplicate history response.');
          ids.add(entry.id); entries.push(entry);
        }
        cursor = data.next_cursor;
        if (cursor && (cursors.has(cursor) || !data.items.length)) throw new Error('Invalid history pagination.');
        if (cursor) cursors.add(cursor);
      } while (cursor && entries.length < 1000);
      return { entries, truncated: cursor !== null };
    },
  };
}
