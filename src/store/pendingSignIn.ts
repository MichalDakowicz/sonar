import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/mmkvStorage';
import type { PendingHandoff } from '@/lib/pingApps';

// The one sign-in this app has asked a sibling for, and so the only answer it
// will take (lib/pingApps readReturn).
//
// Persisted rather than held in memory because asking means leaving: the
// sibling comes to the front, and Android is free to kill this process before
// the answer brings it back. The answer then cold-starts the app, and a state
// that only lived in memory would turn a good token away.
type PendingSignInState = {
  pending: PendingHandoff | null;
  open: (pending: PendingHandoff) => void;
  clear: () => void;
};

export const usePendingSignIn = create<PendingSignInState>()(
  persist(
    (set) => ({
      pending: null,
      open: (pending) => set({ pending }),
      clear: () => set({ pending: null }),
    }),
    { name: 'pending-sign-in', storage: createJSONStorage(() => mmkvStorage), version: 1 },
  ),
);
