import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';

import { claimHandoffLink } from '@/lib/handoffSeen';
import { handoffKey, readShareRequest, SHARE_ROUTE, type ShareRequest } from '@/lib/pingApps';

import { useAuth } from './AuthProvider';
import { answerShareRequest, SELF } from './siblingHandoff';

/**
 * The donor half, behind `<scheme>://share-sign-in`: answer the sibling that
 * asked, then get out of the way. Whatever happens the route leaves for home,
 * so reopening this app later never lands on a spent handoff screen.
 *
 * The root AuthGate holds every route until the session has resolved, so `user`
 * is already final here — a signed-out donor answers "signed out" rather than
 * racing its own session restore.
 */
export function useShareSignIn(): ShareRequest | null {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const answered = useRef(false);

  const request = useMemo(() => (SELF ? readShareRequest(params, SELF.key) : null), [params]);

  useEffect(() => {
    if (answered.current) return;
    answered.current = true;
    // Remembered so a replay of this launch link (useReplayHandoffLink) knows it was answered.
    if (request) claimHandoffLink(handoffKey(SHARE_ROUTE, request.state));
    const leave = () => router.replace('/' as Href);

    if (Platform.OS !== 'android' || !request) {
      leave();
      return;
    }
    answerShareRequest(request, !!user)
      .catch(() => {
        // The requester is gone (uninstalled mid-flight) — nothing to tell.
      })
      .finally(leave);
  }, [request, router, user]);

  return request;
}
