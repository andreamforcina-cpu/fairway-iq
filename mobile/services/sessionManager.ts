import type { Profile, TokenPair } from './sessionApi';

type Storage = { read(): Promise<string | null>; write(value: string): Promise<void>; clear(): Promise<void> };
type Api = { login(email: string, password: string): Promise<TokenPair>; refresh(token: string): Promise<TokenPair>; logout(token: string): Promise<void>; me(token: string): Promise<Profile> };
export type SessionState = { loading: boolean; user: Profile | null; message: string };

/** One queue owns all token/storage mutations. Tokens never enter React state. */
export function createSessionManager(api: Api, storage: Storage, onChanged: (state: SessionState) => void, now = Date.now) {
  let userId: string | null = null;
  function changed(state: SessionState) { userId = state.user?.id ?? null; onChanged(state); }
  let tokens: TokenPair | null = null;
  let expiresAt = 0;
  let queue: Promise<unknown> = Promise.resolve();
  function serial<T>(work: () => Promise<T>): Promise<T> {
    const result = queue.then(work);
    queue = result.catch(() => undefined);
    return result;
  }
  function signedOut(message = '') { tokens = null; expiresAt = 0; changed({ loading: false, user: null, message }); }
  async function revoke(token: string) { try { await api.logout(token); return true; } catch { return false; } }
  async function install(next: TokenPair, started: number) {
    tokens = next; expiresAt = started + next.expires_in * 1000;
    try { await storage.write(next.refresh_token); }
    catch { await revoke(next.refresh_token); throw new Error('Unable to save your session securely. Please log in again.'); }
  }
  async function rotate(token: string) {
    // Delete BEFORE sending: a crash/lost response must never replay a consumed refresh.
    await storage.clear();
    const started = now();
    await install(await api.refresh(token), started);
  }
  async function profile(): Promise<Profile> {
    if (!tokens) throw new Error('Please log in again.');
    if (now() >= expiresAt - 30000) await rotate(tokens.refresh_token);
    try { return await api.me(tokens!.access_token); }
    catch (error) {
      if (!(error && typeof error === 'object' && 'status' in error && error.status === 401)) throw error;
      await rotate(tokens!.refresh_token);
      return api.me(tokens!.access_token);
    }
  }
  async function fail() {
    const token = tokens?.refresh_token;
    signedOut('Session unavailable. Please log in again.');
    try { await storage.clear(); } catch { changed({ loading: false, user: null, message: 'Unable to clear secure storage. Please unlock your device and try again.' }); }
    if (token) await revoke(token);
  }
  return {
    /** Serialized with logout/login; stale account work can never borrow another account's token. */
    authorized: <T>(owner: string, work: (access: string) => Promise<T>): Promise<T> => serial(async () => {
      if (!tokens || userId !== owner) throw new Error('Please log in to this account again.');
      try {
        if (now() >= expiresAt - 30000) await rotate(tokens.refresh_token);
      } catch { await fail(); throw new Error('Please log in again.'); }
      try { return await work(tokens!.access_token); }
      catch (error) {
        if (!(error && typeof error === 'object' && 'status' in error && error.status === 401)) throw error;
        try { await rotate(tokens!.refresh_token); }
        catch { await fail(); throw new Error('Please log in again.'); }
        try { return await work(tokens!.access_token); }
        catch (retryError) {
          if (retryError && typeof retryError === 'object' && 'status' in retryError && retryError.status === 401) await fail();
          throw retryError;
        }
      }
    }),
    restore: () => serial(async () => {
      try {
        const saved = await storage.read();
        if (!saved) { signedOut(); return; }
        await rotate(saved);
        changed({ loading: false, user: await profile(), message: '' });
      } catch { await fail(); }
    }),
    login: (email: string, password: string) => serial(async () => {
      try {
        await storage.clear();
        const started = now();
        await install(await api.login(email, password), started);
        changed({ loading: false, user: await profile(), message: '' });
      } catch (error) { await fail(); throw error; }
    }),
    revalidate: () => serial(async () => {
      if (!tokens) return;
      try { changed({ loading: false, user: await profile(), message: '' }); }
      catch { await fail(); }
    }),
    logout: () => serial(async () => {
      const token = tokens?.refresh_token;
      signedOut();
      let message = '';
      try { await storage.clear(); } catch { message = 'Unable to clear secure storage. Unlock your device and retry logout.'; }
      if (token && !await revoke(token)) message += ' Signed out locally; server revocation could not be confirmed.';
      changed({ loading: false, user: null, message: message.trim() });
    }),
  };
}
