import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import type { ReturnOutcome } from '@/lib/pingApps';

import { useAuth } from './AuthProvider';
import { completeSiblingSignIn } from './siblingHandoff';

/**
 * The requester half, behind `<scheme>://sign-in-return`: redeem the sibling's
 * answer, then go home signed in or back to the login screen with the reason.
 *
 * `onFailure` gets every outcome that did not sign in, including a stale one —
 * an answer to a request that expired should say so, not silently drop the
 * person back where they started.
 */
export function useSignInReturn(onFailure: (outcome: Exclude<ReturnOutcome, { kind: 'token' }>) => void) {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    completeSiblingSignIn(params)
      .catch((): ReturnOutcome => ({ kind: 'stale' }))
      .then((outcome) => {
        if (outcome.kind === 'token') return router.replace('/' as Href);
        // Already signed in, so a late or stray answer changes nothing.
        if (user) return router.replace('/' as Href);
        onFailure(outcome);
        router.replace('/login' as Href);
      });
  }, [onFailure, params, router, user]);
}
