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
  /**
   * SHA-256 of each signing certificate the app is allowed to ship under, as
   * lowercase hex. A package name proves nothing on a sideloaded phone; this does.
   */
  signers: readonly string[];
};

/**
 * Radar's upload key — private. When Radar ships through Play, add Play's
 * app-signing SHA-256 beside it: an install from the store is signed with that.
 */
const RADAR_SIGNER = 'd71a5f6ddd16a9ef9aa43538d2581ea4dc7efdc9d45f99693d7ce0c963f7181e';

/**
 * The debug keystore Expo prebuild writes into `android/app/` — one file, password
 * `android`, the same in every Ping app but Radar's release build. Pinning it tells
 * apart a squatter signed with some other key, not one signed with this: it is not
 * secret. Only a private release key per app closes that, and only Radar has one.
 */
const TEMPLATE_DEBUG_SIGNER = 'fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c';

export const PING_APPS: readonly PingApp[] = [
  { key: 'radar', name: 'Radar', androidPackage: 'com.michaldakowicz.radar', signers: [RADAR_SIGNER] },
  { key: 'lidar', name: 'Lidar', androidPackage: 'com.michaldakowicz.lidar', signers: [TEMPLATE_DEBUG_SIGNER] },
  { key: 'sonar', name: 'Sonar', androidPackage: 'com.michaldakowicz.sonar', signers: [TEMPLATE_DEBUG_SIGNER] },
  { key: 'pulsar', name: 'Pulsar', androidPackage: 'com.michaldakowicz.pulsar', signers: [TEMPLATE_DEBUG_SIGNER] },
  { key: 'cellar', name: 'Cellar', androidPackage: 'com.michaldakowicz.cellar', signers: [TEMPLATE_DEBUG_SIGNER] },
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

/** `AA:bb:…` and `aabb…` both come out as `aabb…`, so keytool's spelling compares too. */
export function normalizeSigner(digest: string): string {
  return digest.replace(/[^0-9a-f]/gi, '').toLowerCase();
}

/**
 * Whether the certificates Android reports for an installed package are the ones
 * `app` ships under. Every one of them must be pinned. Nothing found (not
 * installed, no certificate) fails, and so does an app with no pin at all.
 */
export function isGenuine(app: PingApp, found: readonly string[]): boolean {
  if (found.length === 0) return false;
  const pinned = app.signers.map(normalizeSigner);
  return found.every((digest) => pinned.includes(normalizeSigner(digest)));
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
