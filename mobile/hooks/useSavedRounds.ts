import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSession } from './useSession';
import type { SavedRound } from '../services/roundStore';

/** Home reads through the shared store; account cache refreshes preserve its latest draft. */
export function useSavedRounds() {
  const { rounds: store } = useSession();
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState<SavedRound[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(false);
    void store.load().then(library => {
      if (active) { setHistory(library.history); setNotice(store.notice ?? ''); }
    }).catch(() => {
      if (active) { setHistory(null); setError(true); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry, store]));
  return { history, error, loading, notice, reload: () => setRetry(value => value + 1) };
}
