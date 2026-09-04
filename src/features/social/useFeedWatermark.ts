import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useSocialWatermark } from '@/store/socialWatermark';

/**
 * "New since your last visit" for the feed.
 *
 * The marker is only advanced on blur, which is the moment you have finished
 * reading — so while the screen is focused the value this returns cannot
 * change, and the rows you are looking at do not stop being new mid-scroll.
 * That also means no frozen copy is needed: the store itself is stable for the
 * length of the visit.
 */
export function useFeedWatermark(): string | null {
  const lastSeenAt = useSocialWatermark((state) => state.lastSeenAt);
  const markSeen = useSocialWatermark((state) => state.markSeen);

  useFocusEffect(
    useCallback(() => () => markSeen(new Date().toISOString()), [markSeen]),
  );

  return lastSeenAt;
}
