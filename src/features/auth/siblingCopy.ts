import type { ReturnOutcome } from '@/lib/pingApps';

/** The toast for a sibling sign-in that did not go through, in Sonar's voice. */
export function siblingFailureCopy(outcome: Exclude<ReturnOutcome, { kind: 'token' }>): string {
  if (outcome.kind === 'stale') return 'That sign-in expired — try again';
  if (outcome.failure === 'signed-out') return `${outcome.donor.name} isn't signed in either — sign in here instead`;
  return `Couldn't sign in with ${outcome.donor.name} — try again`;
}
