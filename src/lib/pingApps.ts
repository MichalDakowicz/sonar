/**
 * The Ping family as it sits on one phone, and the two links that carry a
 * sign-in from an app that has one to a sibling that does not (PING.md §9.13).
 *
 *   requester  lidar  ── radar://share-sign-in?for=lidar&state=… ──▶  radar  donor
 *   requester  lidar  ◀── lidar://sign-in-return?state=…&token_hash=… ──  radar
 *
 * The donor answers with a one-time token minted by the `sign-in-handoff` edge
 * function, never with its own session: Supabase rotates refresh tokens, and two
 * apps sharing one would sign each other out on their first overlapping refresh.
 * Both links travel as explicit intents to the named package, so no other app
 * that claims the scheme ever sees the token.
 *
 * Identical in every Ping app. Pure — no React, no react-native, no client.
 */

export type PingAppKey = 'radar' | 'lidar' | 'sonar' | 'pulsar' | 'cellar';

export type PingApp = {
  /** Also the app's URL scheme. */
  key: PingAppKey;
  name: string;
  /** Android application id, which is also where its one activity lives. */
  androidPackage: string;
};

export const PING_APPS: readonly PingApp[] = [
  { key: 'radar', name: 'Radar', androidPackage: 'com.michaldakowicz.radar' },
  { key: 'lidar', name: 'Lidar', androidPackage: 'com.michaldakowicz.lidar' },
  { key: 'sonar', name: 'Sonar', androidPackage: 'com.michaldakowicz.sonar' },
  { key: 'pulsar', name: 'Pulsar', androidPackage: 'com.michaldakowicz.pulsar' },
  { key: 'cellar', name: 'Cellar', androidPackage: 'com.michaldakowicz.cellar' },
];

export const SHARE_ROUTE = 'share-sign-in';
export const RETURN_ROUTE = 'sign-in-return';

/** How long a request waits for its answer. Past this the answer is refused. */
export const HANDOFF_TTL_MS = 5 * 60 * 1000;

/** Hex, at least 16 bytes of it. */
const STATE = /^[0-9a-f]{32,128}$/;
/** GoTrue's hashed token is hex today; the class leaves room for base64url. */
const TOKEN = /^[A-Za-z0-9_-]{16,256}$/;

export type HandoffFailure = 'signed-out' | 'failed';

export type HandoffAnswer = { tokenHash: string } | { failure: HandoffFailure };

/** What this app wrote down when it asked a sibling — the only answer it accepts. */
export type PendingHandoff = { state: string; donor: PingAppKey; at: number };

export type ShareRequest = { requester: PingApp; state: string };

export type ReturnOutcome =
  | { kind: 'token'; tokenHash: string; donor: PingApp }
  | { kind: 'failure'; failure: HandoffFailure; donor: PingApp }
  /** Nothing asked for, a different request, or too late. Never acted on. */
  | { kind: 'stale' };

/** Route params as expo-router hands them over. */
type Params = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function pingApp(key: unknown): PingApp | null {
  return PING_APPS.find((app) => app.key === key) ?? null;
}

export function siblingsOf(self: PingAppKey): PingApp[] {
  return PING_APPS.filter((app) => app.key !== self);
}

/** Expo prebuild names every app's single activity `<package>.MainActivity`. */
export function mainActivityOf(app: PingApp): string {
  return `${app.androidPackage}.MainActivity`;
}

/** The request's state, from random bytes the caller supplies. */
export function stateFrom(bytes: Uint8Array): string {
  if (bytes.length < 16) throw new Error('A handoff state needs at least 16 random bytes');
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function shareRequestUrl(donor: PingApp, requester: PingApp, state: string): string {
  return `${donor.key}://${SHARE_ROUTE}?for=${requester.key}&state=${state}`;
}

/** A request this app may answer, or null. An app never answers itself. */
export function readShareRequest(params: Params, self: PingAppKey): ShareRequest | null {
  const requester = pingApp(one(params.for));
  const state = one(params.state);
  if (!requester || requester.key === self) return null;
  if (!state || !STATE.test(state)) return null;
  return { requester, state };
}

export function returnUrl(requester: PingApp, state: string, answer: HandoffAnswer): string {
  const tail =
    'tokenHash' in answer ? `token_hash=${encodeURIComponent(answer.tokenHash)}` : `error=${answer.failure}`;
  return `${requester.key}://${RETURN_ROUTE}?state=${state}&${tail}`;
}

/**
 * What an answer means, judged against the one request this app has open.
 *
 * The state has to match before anything else is read — including failures — so
 * an app that fires this link unprompted can neither sign this one in to some
 * other account nor make it show an error.
 */
export function readReturn(params: Params, pending: PendingHandoff | null, now: number): ReturnOutcome {
  const state = one(params.state);
  if (!pending || !state || state !== pending.state) return { kind: 'stale' };
  if (now < pending.at || now - pending.at > HANDOFF_TTL_MS) return { kind: 'stale' };
  const donor = pingApp(pending.donor);
  if (!donor) return { kind: 'stale' };

  const tokenHash = one(params.token_hash);
  if (tokenHash && TOKEN.test(tokenHash)) return { kind: 'token', tokenHash, donor };
  const failure: HandoffFailure = one(params.error) === 'signed-out' ? 'signed-out' : 'failed';
  return { kind: 'failure', failure, donor };
}
