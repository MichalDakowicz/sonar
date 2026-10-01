import { FunctionsHttpError } from '@supabase/supabase-js';

import type { Ended } from '@/lib/qrFlow';
import {
  readClaim,
  readJoin,
  readOffer,
  readRedeem,
  readStart,
  readStatus,
  type ApproverStep,
  type Joined,
  type Offered,
  type RequesterStep,
  type Started,
} from '@/lib/qrAnswers';
import { supabase } from '@/lib/supabase';

/**
 * A refusal from the `qr-login` function. The message is the function's own and is
 * written to be shown ("This code has already been used"); the status is for the
 * callers that treat one case differently (410: the code ran out).
 */
export class QrLoginError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'QrLoginError';
    this.status = status;
  }
}

async function call(action: string, body: Record<string, unknown> = {}): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('qr-login', { method: 'POST', body: { action, ...body } });
  if (!error) return data;
  if (error instanceof FunctionsHttpError) {
    const detail: unknown = await error.context.json().catch(() => null);
    const message =
      typeof detail === 'object' && detail !== null && typeof (detail as { error?: unknown }).error === 'string'
        ? (detail as { error: string }).error
        : 'Could not complete that';
    throw new QrLoginError(message, error.context.status);
  }
  throw new QrLoginError('Could not reach the server', 0);
}

/** How a failed call reads on screen: a code that ran out is its own ending, everything else just failed. */
export function endedBy(error: unknown): Ended {
  if (error instanceof QrLoginError) {
    return { phase: 'ended', reason: error.status === 410 ? 'expired' : 'failed', detail: error.message };
  }
  return { phase: 'ended', reason: 'failed' };
}

/** A refusal that will refuse again: the code is wrong, used or gone. Anything else may be a blip. */
export function isFinal(error: unknown): error is QrLoginError {
  return error instanceof QrLoginError && error.status >= 400 && error.status < 500;
}

/** An answer in a shape we do not know is a server we should not act on. */
function understood<T>(value: T | null): T {
  if (value === null) throw new QrLoginError('Could not complete that', 502);
  return value;
}

/** The functions the screens use: signed-out ones first, then the signed-in ones. See docs/qr-login.md in Radar. */
export const qrLogin = {
  /** A browser asks for a code to show. */
  start: async (challenge: string, label: string): Promise<Started> =>
    understood(readStart(await call('start', { challenge, label }))),

  /** A signed-out device scanned a phone's code. */
  join: async (id: string, nonce: string, challenge: string, label: string): Promise<Joined> =>
    understood(readJoin(await call('join', { id, nonce, challenge, label }))),

  /** What became of the code, from the side that holds the verifier. */
  redeem: async (id: string, verifier: string): Promise<RequesterStep> =>
    understood(readRedeem(await call('redeem', { id, verifier }))),

  /** A signed-in phone asks for a code to show. */
  offer: async (): Promise<Offered> => understood(readOffer(await call('offer'))),

  /** A signed-in phone scanned a browser's code. */
  claim: async (id: string) => understood(readClaim(await call('claim', { id }))),

  status: async (id: string): Promise<ApproverStep> => understood(readStatus(await call('status', { id }))),

  approve: async (id: string): Promise<void> => void (await call('approve', { id })),

  deny: async (id: string): Promise<void> => void (await call('deny', { id })),
};
