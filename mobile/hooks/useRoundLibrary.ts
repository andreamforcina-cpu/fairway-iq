import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSession } from './useSession';
import { decodeLibrary } from '../services/roundStore';
import type { RoundLibrary } from '../services/roundStore';

export function useRoundLibrary() {
  const { rounds: store } = useSession();
  const [library, setLibrary] = useState<RoundLibrary | null>(null);
  const [message, setMessage] = useState('Loading saved rounds…');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [reload, setReload] = useState(0);
  const revision = useRef(0);
  const latest = useRef<RoundLibrary | null>(null);
  const persisted = useRef<RoundLibrary | null>(null);
  const handledRetry = useRef(0);
  const scope = useRef(store);
  scope.current = store;
  latest.current = library;
  useFocusEffect(useCallback(() => {
    let active = true;
    const before = latest.current;
    const unsaved = before !== persisted.current;
    setLoading(true);
    void store.load().then(value => {
      if (!active || scope.current !== store) return;
      // A refresh must not replace score input entered while the request was in flight.
      setLibrary(previous => (previous !== before || unsaved) && previous ? { ...value, draft: previous.draft, current: previous.current,
        history: [...previous.history.filter(entry => !value.history.some(item => item.id === entry.id)), ...value.history] } : value);
      setMessage(store.notice ?? '');
    }).catch(() => {
      if (active && scope.current === store) setMessage('Unable to read saved rounds. Existing data has been kept. Retry loading before entering scores.');
    }).finally(() => { if (active && scope.current === store) setLoading(false); });
    return () => { active = false; };
  }, [store, reload]));
  useEffect(() => {
    if (!library) return;
    const current = ++revision.current;
    setSaving(true);
    const retryRequested = retry !== handledRetry.current;
    handledRetry.current = retry;
    void store.save(library, retryRequested).then(result => {
      if (scope.current === store && revision.current === current) {
        persisted.current = library;
        setMessage(store.notice ?? ''); setSaving(false);
        if (result && typeof result === 'object' && 'history' in result) {
          const saved = decodeLibrary(JSON.stringify(result));
          setLibrary(previous => previous === library && JSON.stringify(previous.history) !== JSON.stringify(saved.history)
            ? { ...previous, history: saved.history } : previous);
        }
      }
    }).catch(() => {
      if (scope.current === store && revision.current === current) { setMessage('Changes could not be saved. Keep the app open and retry saving.'); setSaving(false); }
    });
  }, [library, retry, store]);
  return { library, setLibrary, message, saving, loading, load: () => setReload(value => value + 1), retrySave: () => setRetry(value => value + 1) };
}
