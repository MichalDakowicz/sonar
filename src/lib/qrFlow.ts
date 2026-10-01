/**
 * Where a QR pairing stands, on each side of it (PING.md §9.14). Pure: the hooks in
 * features/auth/qr feed these the server's answers and render whatever comes out.
 */
import type { ApproverStep, Requester, RequesterStep } from './qrAnswers';

/**
 * A code that runs out is replaced, never extended — but only a few times, so a page
 * left open overnight does not keep minting pairings.
 */
export const MAX_RENEWALS = 4;

/** Why a pairing ended without anyone deciding. `detail` is the server's own words, already fit to show. */
export type Ended = { phase: 'ended'; reason: 'expired' | 'failed'; detail?: string };

// ---------------------------------------------------------------------------
// The signed-in side: it approves, whichever of the two shows the code.

export type ApproverState =
  | { phase: 'idle' }
  | { phase: 'working' }
  /** Phone mode: this phone is showing a code and waiting for a signed-out device to scan it. */
  | { phase: 'showing'; id: string; payload: string; matchCode: string; expiresAt: string; renewals: number }
  /** Somebody is asking. Nothing happens until a person says yes or no. */
  | {
      phase: 'confirm';
      id: string;
      matchCode: string;
      requester: Requester;
      expiresAt: string;
      deciding: 'approve' | 'decline' | null;
    }
  | { phase: 'approved' }
  | { phase: 'declined' }
  | Ended;

/** What a status poll changes. Anything not live — finished, failed, idle — is left alone. */
export function approverAfterStep(state: ApproverState, step: ApproverStep): ApproverState {
  if (state.phase !== 'showing' && state.phase !== 'confirm') return state;
  switch (step.kind) {
    case 'showing':
      // Pairings only move forward: a request already in front of the person stays there.
      return state;
    case 'confirm':
      return {
        phase: 'confirm',
        id: state.id,
        matchCode: step.matchCode,
        requester: step.requester,
        expiresAt: step.expiresAt,
        deciding: state.phase === 'confirm' ? state.deciding : null,
      };
    case 'approved':
      return { phase: 'approved' };
    case 'denied':
      return { phase: 'declined' };
    case 'expired':
      return { phase: 'ended', reason: 'expired' };
  }
}

/** Whether a code this phone was showing has run out and should be swapped for a new one. */
export function shouldRenewOffer(state: ApproverState, step: ApproverStep): boolean {
  return state.phase === 'showing' && step.kind === 'expired' && state.renewals < MAX_RENEWALS;
}

// ---------------------------------------------------------------------------
// The signed-out side: it asks, and collects once it has been let in.

export type RequesterState =
  | { phase: 'idle' }
  | { phase: 'working' }
  /** Web mode: this screen is showing a code and waiting for a signed-in phone to scan it. */
  | { phase: 'showing'; id: string; payload: string; matchCode: string; expiresAt: string; renewals: number }
  /** Scanned, and a person on the other device is deciding. */
  | { phase: 'deciding'; id: string; matchCode: string; expiresAt: string }
  /** Approved: the token is in hand and is being turned into a session. */
  | { phase: 'signing-in' }
  | { phase: 'denied' }
  | Ended;

export function requesterAfterStep(state: RequesterState, step: RequesterStep): RequesterState {
  if (state.phase !== 'showing' && state.phase !== 'deciding') return state;
  switch (step.kind) {
    case 'showing':
      return state;
    case 'deciding':
      return { phase: 'deciding', id: state.id, matchCode: step.matchCode, expiresAt: step.expiresAt };
    case 'token':
      return { phase: 'signing-in' };
    case 'denied':
      return { phase: 'denied' };
  }
}

/** Whether a browser's code has run out and should be swapped for a new one. */
export function shouldRenewStart(state: RequesterState): boolean {
  return state.phase === 'showing' && state.renewals < MAX_RENEWALS;
}
