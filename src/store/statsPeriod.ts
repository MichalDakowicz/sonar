import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/mmkvStorage';
import type { StatsPeriodId } from '@/lib/statsPeriod';

type StatsPeriodState = {
  period: StatsPeriodId;
  setPeriod: (period: StatsPeriodId) => void;
};

// Durable, like the Library's view prefs: which window you read your stats in is
// how you like to look at them, not a one-off narrowing.
export const useStatsPeriod = create<StatsPeriodState>()(
  persist(
    (set) => ({
      period: 'all',
      setPeriod: (period) => set({ period }),
    }),
    { name: 'radar.statsPeriod', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

type StatsPeriodSheetState = {
  present: (() => void) | null;
  setPresent: (present: (() => void) | null) => void;
};

// The picker sheet mounts once in the nav bar (which is always on screen), so
// both the nav's left action and the pill on the Stats screen can open the same
// instance. Same trick as the global Quick-Add sheet.
export const useStatsPeriodSheet = create<StatsPeriodSheetState>((set) => ({
  present: null,
  setPresent: (present) => set({ present }),
}));
