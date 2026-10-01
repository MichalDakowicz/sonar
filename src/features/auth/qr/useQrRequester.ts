import { useCallback, useEffect, useRef, useState } from 'react';

import { requesterAfterStep, shouldRenewStart, type RequesterState } from '@/lib/qrFlow';
import { qrPayload, type QrTarget } from '@/lib/qrLogin';
import { startPolling } from '@/lib/qrPoll';
import { supabase } from '@/lib/supabase';

import { endedBy, isFinal, qrLogin } from './qrLoginApi';
import { newVerifier, thisDevice } from './qrSecrets';

/**
 * The signed-out side of a pairing (PING.md §9.14): the device that wants in. It gets
 * there one of two ways — it shows a code for a signed-in phone to scan (`showCode`,
 * the browser), or it scans a code a signed-in phone is showing (`join`).
 *
 * Either way it keeps a verifier that never leaves it. Only that holder can collect
 * the one-time token once a person on the other side has said yes, and the token is
 * turned into a session of this app's own with `verifyOtp` — the same last step as
 * the sibling handoff.
 */
export function useQrRequester() {
  const [state, setState] = useState<RequesterState>({ phase: 'idle' });

  // Memory only, and not state: it must never render, and never be saved.
  const verifier = useRef<string | null>(null);

  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  const showCode = useCallback(async (renewals = 0) => {
    setState({ phase: 'working' });
    try {
      const secret = await newVerifier();
      const started = await qrLogin.start(secret.challenge, thisDevice());
      verifier.current = secret.verifier;
      setState({
        phase: 'showing',
        id: started.id,
        payload: qrPayload({ mode: 'web', id: started.id }),
        matchCode: started.matchCode,
        expiresAt: started.expiresAt,
        renewals,
      });
    } catch (error) {
      setState(endedBy(error));
    }
  }, []);

  const join = useCallback(async (target: Extract<QrTarget, { mode: 'phone' }>) => {
    setState({ phase: 'working' });
    try {
      const secret = await newVerifier();
      const joined = await qrLogin.join(target.id, target.nonce, secret.challenge, thisDevice());
      verifier.current = secret.verifier;
      setState({ phase: 'deciding', id: target.id, matchCode: joined.matchCode, expiresAt: joined.expiresAt });
    } catch (error) {
      setState(endedBy(error));
    }
  }, []);

  const reset = useCallback(() => {
    verifier.current = null;
    setState({ phase: 'idle' });
  }, []);

  // One poll per pairing. It must not restart when the state moves underneath it: a
  // second `redeem` racing the one that collects the token would find it gone.
  const waiting = state.phase === 'showing' || state.phase === 'deciding';
  const id = waiting ? state.id : null;
  useEffect(() => {
    const secret = verifier.current;
    if (!id || !secret) return;
    return startPolling(
      async () => {
        let step;
        try {
          step = await qrLogin.redeem(id, secret);
        } catch (error) {
          if (!isFinal(error)) throw error;
          const ended = endedBy(error);
          const current = latest.current;
          if (ended.reason === 'expired' && current.phase === 'showing' && shouldRenewStart(current)) {
            void showCode(current.renewals + 1);
          } else {
            setState(ended);
          }
          return 'stop';
        }

        if (step.kind === 'token') {
          setState({ phase: 'signing-in' });
          try {
            const { error } = await supabase.auth.verifyOtp({ token_hash: step.tokenHash, type: 'email' });
            if (error) setState({ phase: 'ended', reason: 'failed', detail: error.message });
          } catch {
            setState({ phase: 'ended', reason: 'failed' });
          }
          return 'stop';
        }

        setState((previous) => requesterAfterStep(previous, step));
        return step.kind === 'denied' ? 'stop' : 'continue';
      },
      { onGiveUp: (error) => setState(endedBy(error)) },
    );
  }, [id, showCode]);

  return { state, showCode, join, reset };
}
