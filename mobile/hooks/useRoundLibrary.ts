import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRoundStore } from '../services/roundStore';
import type { RoundLibrary } from '../services/roundStore';

const store = createRoundStore(AsyncStorage);
export function useRoundLibrary() {
  const [library, setLibrary] = useState<RoundLibrary | null>(null);
  const [message, setMessage] = useState('Loading saved rounds…');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const reading = useRef(false);
  const [retry, setRetry] = useState(0);
  const revision = useRef(0);
  function load() {
    if (reading.current) return;
    reading.current = true;
    setLoading(true);
    setMessage('Loading saved rounds…');
    void store.load().then(value => { setLibrary(value); setMessage(''); }).catch(() => setMessage('Unable to read saved rounds. Existing data has been kept. Retry loading before entering scores.')).finally(() => { reading.current = false; setLoading(false); });
  }
  useEffect(load, []);
  useEffect(() => {
    if (!library) return;
    const current = ++revision.current;
    setSaving(true);
    void store.save(library).then(() => {
      if (revision.current === current) { setMessage(''); setSaving(false); }
    }).catch(() => {
      if (revision.current === current) { setMessage('Changes could not be saved. Keep the app open and retry saving.'); setSaving(false); }
    });
  }, [library, retry]);
  return { library, setLibrary, message, saving, loading, load, retrySave: () => setRetry(value => value + 1) };
}
