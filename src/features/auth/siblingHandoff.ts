import { FunctionsHttpError } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { getRandomBytes } from 'expo-crypto';
import * as IntentLauncher from 'expo-intent-launcher';

import {
  mainActivityOf,
  pingApp,
  readReturn,
  returnUrl,
  shareRequestUrl,
  stateFrom,
  type HandoffAnswer,
  type PingApp,
  type ReturnOutcome,
  type ShareRequest,
} from '@/lib/pingApps';
import { supabase } from '@/lib/supabase';
import { usePendingSignIn } from '@/store/pendingSignIn';

// Signing in from a sibling on the same phone (PING.md §9.13). The link rules
// are pure and live in lib/pingApps; this is only the part that talks to
// Android and to Supabase. Identical in every Ping app.

const scheme = Constants.expoConfig?.scheme;

/** This app, as the family knows it. Its scheme is its key. */
export const SELF: PingApp | null = pingApp(Array.isArray(scheme) ? scheme[0] : scheme);

/**
 * Starts a new task rather than stacking on this one. It is also what makes the
 * launcher's result promise settle straight away: Android cancels the result of
 * anything launched into a new task instead of waiting for it to finish.
 */
const FLAG_ACTIVITY_NEW_TASK = 0x10000000;

/**
 * An explicit intent — package *and* activity — so no other app that claims the
 * same scheme can receive it. The launcher ignores `packageName` on its own.
 */
async function launch(app: PingApp, url: string): Promise<void> {
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: url,
    packageName: app.androidPackage,
    className: mainActivityOf(app),
    flags: FLAG_ACTIVITY_NEW_TASK,
  });
}

/** Requester: ask `donor` for a sign-in. The answer arrives on sign-in-return. */
export async function requestSiblingSignIn(donor: PingApp): Promise<void> {
  if (!SELF) throw new Error('This build does not know which Ping app it is');
  const state = stateFrom(getRandomBytes(24));
  usePendingSignIn.getState().open({ state, donor: donor.key, at: Date.now() });
  await launch(donor, shareRequestUrl(donor, SELF, state));
}

async function mintAnswer(): Promise<HandoffAnswer> {
  const { data, error } = await supabase.functions.invoke<{ token_hash?: string }>('sign-in-handoff', {
    method: 'POST',
  });
  if (!error && data?.token_hash) return { tokenHash: data.token_hash };
  const signedOut = error instanceof FunctionsHttpError && error.context.status === 401;
  return { failure: signedOut ? 'signed-out' : 'failed' };
}

/**
 * Donor: answer a request, with a fresh one-time token when this app has a
 * session and with the reason when it cannot. It always answers — a requester
 * left waiting just sits on its spinner.
 */
export async function answerShareRequest(request: ShareRequest, signedIn: boolean): Promise<void> {
  const answer: HandoffAnswer = signedIn ? await mintAnswer() : { failure: 'signed-out' };
  await launch(request.requester, returnUrl(request.requester, request.state, answer));
}

/**
 * Requester: take the answer. A token is redeemed into a session of this app's
 * own; the request is closed either way, so one answer is all it ever gets.
 */
export async function completeSiblingSignIn(
  params: Record<string, string | string[] | undefined>,
): Promise<ReturnOutcome> {
  const store = usePendingSignIn.getState();
  const outcome = readReturn(params, store.pending, Date.now());
  if (outcome.kind === 'stale') return outcome;
  store.clear();
  if (outcome.kind !== 'token') return outcome;

  const failed: ReturnOutcome = { kind: 'failure', failure: 'failed', donor: outcome.donor };
  try {
    const { error } = await supabase.auth.verifyOtp({ token_hash: outcome.tokenHash, type: 'email' });
    return error ? failed : outcome;
  } catch {
    return failed;
  }
}
