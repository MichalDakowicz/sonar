import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/mmkvStorage';
import { clampTime, DEFAULT_TIME, type TimeOfDay } from '@/lib/reminderTime';

/**
 * The daily reminder: whether it is on, and when it lands. Identical in Lidar and
 * Sonar.
 *
 * Off by default. A reminder is something you ask for, and the permission sheet
 * that comes with the first one should appear because you flipped the switch, not
 * because the app opened.
 *
 * Device-local (MMKV) like the other per-device preferences: the queue it drives
 * lives on this phone, so a copy on the shared `user_settings` row would only
 * promise a reminder on a phone that never scheduled one.
 */
type ReminderPrefsState = TimeOfDay & {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  setTime: (time: TimeOfDay) => void;
};

export const useReminderPrefs = create<ReminderPrefsState>()(
  persist(
    (set) => ({
      enabled: false,
      ...DEFAULT_TIME,
      setEnabled: (enabled) => set({ enabled }),
      setTime: (time) => set(clampTime(time)),
    }),
    { name: 'reminder-prefs', storage: createJSONStorage(() => mmkvStorage), version: 1 },
  ),
);
