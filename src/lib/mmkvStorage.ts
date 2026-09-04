import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

// Durable-prefs tier (doc 05) - zustand `persist` backed by MMKV instead of
// AsyncStorage/localStorage, shared by every UI-prefs store (filters, sort, view mode).
const storage = createMMKV({ id: 'radar-prefs' });

export const mmkvStorage: StateStorage = {
  getItem: (key) => storage.getString(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.remove(key),
};
