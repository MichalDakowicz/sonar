import { useCallback, useEffect, useRef, useState } from 'react';

import { approverAfterStep, shouldRenewOffer, type ApproverState } from '@/lib/qrFlow';
import { startPolling } from '@/lib/qrPoll';

import { endedBy, isFinal, qrLogin } from './qrLoginApi';

/**
 * The signed-in side of a pairing (PING.md §9.14): the phone that says yes. It gets
 * there one of two ways — it scans a browser's code (`claim`), or it shows one of its
 * own and waits for a signed-out device to scan it (`showCode`). From the first
 * request on, the two are the same: look at who is asking, then approve or decline.
 *
 * Nothing here approves by itself. `decide` is called by a button a person pressed.
 */
export function useQrApprover() {
  const [state, setState] = useState<ApproverState>({ phase: 'idle' });

  // The poll reads the state it was started under; this is how it sees the current one.
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  const showCode = useCallback(async (renewals = 0) => {
    setState({ phase: 'working' });
    try {
      const offered = await qrLogin.offer();
      setState({
        phase: 'showing',
        id: offered.id,
        payload: offered.payload,
        matchCode: offered.matchCode,
        expiresAt: offered.expiresAt,
        renewals,
      });
    } catch (error) {
      setState(endedBy(error));
    }
  }, []);

  const claim = useCallback(async (id: string) => {
    setState({ phase: 'working' });
    try {
      const asked = await qrLogin.claim(id);
      setState({
        phase: 'confirm',
        id,
        matchCode: asked.matchCode,
        requester: asked.requester,
        expiresAt: asked.expiresAt,
        deciding: null,
      });
    } catch (error) {
      setState(endedBy(error));
    }
  }, []);

  const decide = useCallback(
    async (verdict: 'approve' | 'decline') => {
      if (state.phase !== 'confirm' || state.deciding) return;
      setState({ ...state, deciding: verdict });
      try {
        if (verdict === 'approve') await qrLogin.approve(state.id);
        else await qrLogin.deny(state.id);
        setState({ phase: verdict === 'approve' ? 'approved' : 'declined' });
      } catch (error) {
        setState(endedBy(error));
      }
    },
    [state],
  );

  const reset = useCallback(() => setState({ phase: 'idle' }), []);

  // Walking away withdraws what was on offer: a code left for its minute is a code
  // somebody could still scan, and a request nobody answered should not be
  // answerable later. Best effort — the clock would end it anyway.
  useEffect(
    () => () => {
      const current = latest.current;
      if (current.phase === 'showing' || current.phase === 'confirm') void qrLogin.deny(current.id).catch(() => {});
    },
    [],
  );

  // While there is a pairing to watch, ask the server what became of it. The id is
  // the only dependency: the state changing underneath must not restart the poll.
  const watching = state.phase === 'showing' || state.phase === 'confirm';
  const id = watching ? state.id : null;
  useEffect(() => {
    if (!id) return;
    return startPolling(
      async () => {
        let step;
        try {
          step = await qrLogin.status(id);
        } catch (error) {
          if (!isFinal(error)) throw error;
          setState(endedBy(error));
          return 'stop';
        }

        const current = latest.current;
        if (current.phase === 'showing' && shouldRenewOffer(current, step)) {
          void showCode(current.renewals + 1);
          return 'stop';
        }
        setState((previous) => approverAfterStep(previous, step));
        return step.kind === 'showing' || step.kind === 'confirm' ? 'continue' : 'stop';
      },
      { onGiveUp: (error) => setState(endedBy(error)) },
    );
  }, [id, showCode]);

  return { state, showCode, claim, decide, reset };
}
