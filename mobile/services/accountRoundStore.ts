import { createRoundStore, decodeLibrary, isUuid } from './roundStore';
import type { RoundLibrary, RoundStorage, SavedRound } from './roundStore';
import { submission } from './roundApi';

type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
type Api = { submit(entry: SavedRound): Promise<SavedRound>; history(): Promise<{ entries: SavedRound[]; truncated: boolean }> };
const sameRound = (a: SavedRound, b: SavedRound) => JSON.stringify(submission(a)) === JSON.stringify(submission(b));

/** Merge immutable history without letting a stale UI snapshot erase an acknowledgment. */
export function mergeAccountHistory(incoming: SavedRound[], existing: SavedRound[]): SavedRound[] {
  const entries = new Map(existing.map(entry => [entry.id, entry]));
  for (const entry of incoming) {
    if (!isUuid(entry.id)) throw new Error('Unowned local history cannot be synced.');
    const previous = entries.get(entry.id);
    if (previous && (!sameRound(previous, entry) || (previous.serverId && entry.serverId && previous.serverId !== entry.serverId))) throw new Error('Conflicting local round.');
    entries.set(entry.id, { ...entry, ...(previous?.serverId ? { serverId: previous.serverId } : {}) });
  }
  const result = [...entries.values()].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt) || b.id.localeCompare(a.id));
  // Pending rounds are never evicted. Older acknowledged entries can be fetched again.
  const pending = result.filter(entry => !entry.serverId);
  if (pending.length > 1000) throw new Error('Pending history is full.');
  const retained = new Set([...pending, ...result.filter(entry => entry.serverId).slice(0, 1000 - pending.length)].map(entry => entry.id));
  return result.filter(entry => retained.has(entry.id));
}

export function createAccountRoundStore(storage: Storage, server: string, owner: string, api: Api): RoundStorage {
  if (!isUuid(owner)) throw new Error('Invalid account identifier.');
  const local = createRoundStore(storage, `fairway-iq.account-rounds.v1:${encodeURIComponent(server)}:${owner}`);
  let queue: Promise<unknown> = Promise.resolve();
  let notice = '';
  let historyNotice = '';
  const attempted = new Set<string>();
  function serial<T>(work: () => Promise<T>): Promise<T> {
    const result = queue.then(work); queue = result.catch(() => undefined); return result;
  }
  async function upload(library: RoundLibrary): Promise<RoundLibrary> {
    for (const entry of library.history.filter(item => !item.serverId && !attempted.has(item.id))) {
      attempted.add(entry.id);
      const acknowledged = await api.submit(entry);
      library = { ...library, history: mergeAccountHistory([acknowledged], library.history) };
      await local.save(library);
    }
    return library;
  }
  return {
    get notice() { return notice; },
    load: () => serial(async () => {
      let library = await local.load();
      // Validate ownership format even when offline; never read the legacy shared key.
      library = { ...library, history: mergeAccountHistory(library.history, []) };
      notice = '';
      attempted.clear();
      try {
        library = await upload(library);
        const remote = await api.history();
        library = { ...library, history: mergeAccountHistory(remote.entries, library.history) };
        await local.save(library);
        historyNotice = remote.truncated ? 'Showing up to 1,000 cached rounds. Older rounds remain on your account.' : '';
        notice = historyNotice;
      } catch {
        historyNotice = 'Account sync unavailable. Showing this account’s local copies; pending rounds will retry when you refresh.';
        notice = historyNotice;
      }
      return library;
    }),
    save(library, retry = false) {
      const snapshot = decodeLibrary(JSON.stringify(library));
      return serial(async () => {
        const existing = await local.load();
        let next = { ...snapshot, history: mergeAccountHistory(snapshot.history, existing.history) };
        if (retry) attempted.clear();
        // Persist the submission UUID and exact payload before any request (including retries).
        await local.save(next);
        try { next = await upload(next); }
        catch { /* Retain the durable pending copy; explicit refresh retries the same key. */ }
        notice = next.history.some(entry => !entry.serverId)
          ? 'Saved on this device for this account. Some rounds are pending sync; retry when connected.'
          : historyNotice;
        return next;
      });
    },
  };
}
