/**
 * Sibling sign-in links this JS runtime has already acted on (PING.md §9.13).
 *
 * Module scope is the point: it outlives the React tree. When Android recreates
 * an Activity around a runtime that is still alive, the app re-reads its launch
 * link — and the Activity's original link is still sitting in its intent. This is
 * what tells a link that is new from one that was already answered.
 *
 * Pure — no React, no react-native. Identical in every Ping app.
 */

const REMEMBERED = 32;
const seen: string[] = [];

/** True the first time a link is offered, false for every time after. */
export function claimHandoffLink(key: string): boolean {
  if (seen.includes(key)) return false;
  seen.push(key);
  if (seen.length > REMEMBERED) seen.shift();
  return true;
}

/** Test seam: a fresh runtime has seen nothing. */
export function forgetHandoffLinks(): void {
  seen.length = 0;
}
