import { finishRound, validateCourseName } from '../utils/round';
import type { Round, RoundDraft } from '../types/round';

export interface SavedRound { id: string; completedAt: string; round: Round }
export interface RoundLibrary { version: 1; draft: RoundDraft | null; current: number; history: SavedRound[] }
export const emptyLibrary = (): RoundLibrary => ({ version: 1, draft: null, current: 0, history: [] });
export function completeRound(library: RoundLibrary, completedAt: string, allowPartial = false): RoundLibrary {
  if (!library.draft) throw new Error('No active round');
  if (library.history.length >= 1000) throw new Error('Round history is full');
  if (!Number.isFinite(Date.parse(completedAt))) throw new Error('Invalid completion date');
  let suffix = 0;
  let id = completedAt;
  while (library.history.some(entry => entry.id === id)) id = `${completedAt}-${++suffix}`;
  const entry = { id, completedAt, round: finishRound(library.draft, allowPartial) };
  return { version: 1, draft: null, current: 0, history: [entry, ...library.history] };
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function draft(value: unknown): RoundDraft {
  if (!object(value) || typeof value.courseName !== 'string' || validateCourseName(value.courseName) || (value.holeCount !== 9 && value.holeCount !== 18) || !Array.isArray(value.holes) || value.holes.length !== value.holeCount) throw new Error('Invalid round');
  const holes = value.holes.map((hole: unknown, index: number) => {
    if (!object(hole) || hole.number !== index + 1 || !['par', 'strokes', 'putts'].every(field => typeof hole[field] === 'string' && (hole[field] as string).length <= 3)) throw new Error('Invalid hole');
    return { number: index + 1, par: hole.par as string, strokes: hole.strokes as string, putts: hole.putts as string };
  });
  return { courseName: value.courseName, holeCount: value.holeCount, holes };
}
export function decodeLibrary(raw: string | null): RoundLibrary {
  if (raw === null) return emptyLibrary();
  if (raw.length > 5000000) throw new Error('Round storage too large');
  const value: unknown = JSON.parse(raw);
  if (!object(value) || value.version !== 1 || !Number.isInteger(value.current) || !Array.isArray(value.history) || value.history.length > 1000) throw new Error('Invalid library');
  const active = value.draft === null ? null : draft(value.draft);
  if ((value.current as number) < 0 || (value.current as number) >= (active?.holeCount ?? 1)) throw new Error('Invalid active hole');
  const ids = new Set<string>();
  const history = value.history.map((entry: unknown): SavedRound => {
    if (!object(entry) || typeof entry.id !== 'string' || !entry.id || entry.id.length > 100 || ids.has(entry.id) || typeof entry.completedAt !== 'string' || !Number.isFinite(Date.parse(entry.completedAt)) || !object(entry.round) || !Array.isArray(entry.round.holes)) throw new Error('Invalid history');
    ids.add(entry.id);
    const holes = entry.round.holes.map((hole: unknown) => {
      if (!object(hole) || !['number', 'par', 'strokes', 'putts'].every(field => Number.isInteger(hole[field]))) throw new Error('Invalid score');
      return { number: hole.number, par: String(hole.par), strokes: String(hole.strokes), putts: String(hole.putts) };
    });
    const planned = entry.round.holeCount;
    if ((planned !== 9 && planned !== 18) || holes.length < 1 || holes.length > planned) throw new Error('Invalid completed hole count');
    const padded = [...holes, ...Array.from({ length: planned - holes.length }, (_, index) => ({ number: holes.length + index + 1, par: '4', strokes: '', putts: '' }))];
    return { id: entry.id, completedAt: entry.completedAt, round: finishRound(draft({ ...entry.round, holes: padded }), true) };
  });
  return { version: 1, draft: active, current: value.current as number, history };
}

/** Serialize reads and snapshots so storage operations cannot overtake each other. */
export function createRoundStore(storage: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> }) {
  const key = 'fairway-iq.rounds.v1';
  let queue: Promise<unknown> = Promise.resolve();
  return {
    load() {
      const result = queue.then(async () => decodeLibrary(await storage.getItem(key)));
      queue = result.catch(() => undefined);
      return result;
    },
    save(library: RoundLibrary) {
      const raw = JSON.stringify(library);
      decodeLibrary(raw);
      const result = queue.then(() => storage.setItem(key, raw));
      queue = result.catch(() => undefined);
      return result;
    },
  };
}
