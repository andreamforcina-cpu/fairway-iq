import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { baseUrl } from './api';
import { validRefresh } from './sessionApi';

// Bind stored credentials to the configured server; never send them to another API.
const key = 'fairway-iq.session.v1';
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export const sessionStorage = {
  async read(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    const raw = await SecureStore.getItemAsync(key, options);
    if (!raw) return null;
    try {
      const data: unknown = JSON.parse(raw);
      if (data && typeof data === 'object' && 'server' in data && data.server === baseUrl() && 'refresh' in data && validRefresh(data.refresh)) return data.refresh;
    } catch { /* Invalid local data is removed without logging its contents. */ }
    await this.clear();
    return null;
  },
  async write(refresh: string) {
    if (Platform.OS === 'web') return; // Browser sessions remain memory-only.
    await SecureStore.setItemAsync(key, JSON.stringify({ server: baseUrl(), refresh }), options);
  },
  async clear() {
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key, options);
  },
};
