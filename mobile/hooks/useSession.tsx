import { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { createSessionManager } from '../services/sessionManager';
import type { SessionState } from '../services/sessionManager';
import { sessionApi } from '../services/sessionApi';
import { sessionStorage } from '../services/sessionStorage';

type SessionContext = SessionState & {
  preview: boolean; startPreview(): void;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
};
const Context = createContext<SessionContext | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ loading: true, user: null, message: '' });
  const [preview, setPreview] = useState(false);
  const [manager] = useState(() => createSessionManager(sessionApi, sessionStorage, next => {
    setState(next);
    if (next.user) setPreview(false);
  }));
  useEffect(() => {
    void manager.restore();
    const listener = AppState.addEventListener('change', status => {
      if (status === 'active') void manager.revalidate();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void manager.revalidate();
    }, 60000);
    return () => { listener.remove(); clearInterval(timer); };
  }, [manager]);
  return <Context.Provider value={{ ...state, preview, startPreview: () => setPreview(true), login: manager.login, logout: async () => { setPreview(false); await manager.logout(); } }}>{children}</Context.Provider>;
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('SessionProvider is required.');
  return value;
}
