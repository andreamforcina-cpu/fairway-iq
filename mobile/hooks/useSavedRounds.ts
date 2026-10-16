import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { roundLibraryStore } from '../services/roundLibraryStore';
import type { SavedRound } from '../services/roundStore';

/** Read-only: visiting Home must never save a stale snapshot over a draft. */
export function useSavedRounds() {
  const [history, setHistory] = useState<SavedRound[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(false);
    void roundLibraryStore.load().then(library => {
      if (active) setHistory(library.history);
    }).catch(() => {
      if (active) { setHistory(null); setError(true); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]));
  return { history, error, loading, reload: () => setRetry(value => value + 1) };
}
