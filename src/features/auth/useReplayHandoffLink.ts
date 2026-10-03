import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { claimHandoffLink } from '@/lib/handoffSeen';
import { readHandoffLink } from '@/lib/pingApps';

import { SELF } from './siblingHandoff';

/**
 * Whether this JS runtime has mounted the app before. Module scope, so it survives
 * the React tree being torn down and rebuilt around the same runtime.
 */
let mountedBefore = false;

/**
 * Picks up a sibling sign-in link that never arrived as an event (PING.md §9.13).
 *
 * Android destroys an app's Activity when it is backed out of, but the process and
 * its JS runtime can live on. The next launch builds a new Activity around that
 * runtime: the tree remounts, and expo-router has already spent its initial URL, so
 * the link in the new Activity's intent goes nowhere and the app just opens. A
 * request for a sign-in then sits unanswered until the app is killed and started
 * cold. So the launch link is read back from the intent whenever a new Activity has
 * attached — on a mount after the first, and on coming back to the foreground — and
 * routed unless it was already acted on.
 *
 * A cold start is left to expo-router, which routes its own launch link.
 */
export function useReplayHandoffLink() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'android' || !SELF) return;
    const self = SELF.key;

    const replay = async () => {
      try {
        const url = await Linking.getInitialURL();
        const link = url ? readHandoffLink(url, self) : null;
        if (link && claimHandoffLink(link.key)) router.navigate(link.href as Href);
      } catch {
        // No link to read, or the router is not up yet. Nothing was lost: the
        // request simply was not answered, as before.
      }
    };

    if (mountedBefore) replay();
    mountedBefore = true;

    let wasAway = false;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') wasAway = true;
      else if (wasAway) {
        wasAway = false;
        replay();
      }
    });
    return () => subscription.remove();
  }, [router]);
}
