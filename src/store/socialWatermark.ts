import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/mmkvStorage';

// "New since your last visit" for the Social feed — the thing the rail's
// spinning ring and its badge count against.
//
// Deliberately device-local rather than a column on the server: it is a reading
// position, not shared state, and syncing it would mean a write on every glance
// at the tab. The cost is that a second device starts its own count, which is
// the same trade every offline-first read marker makes.
type SocialWatermarkState = {
  lastSeenAt: string | null;
  markSeen: (iso: string) => void;
};

export const useSocialWatermark = create<SocialWatermarkState>()(
  persist(
    (set) => ({
      lastSeenAt: null,
      markSeen: (iso) =>
        // Monotonic: a stale write (a slow blur landing after a newer visit)
        // must never rewind the marker and resurrect already-seen activity.
        set((state) =>
          state.lastSeenAt && Date.parse(state.lastSeenAt) >= Date.parse(iso) ? state : { lastSeenAt: iso },
        ),
    }),
    { name: 'social-watermark', storage: createJSONStorage(() => mmkvStorage), version: 1 },
  ),
);
