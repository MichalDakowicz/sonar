/**
 * Signing in with a QR code (PING.md §9.14) — the half that needs no network, no
 * camera and no React. Identical in every Ping app.
 *
 * One side is signed out and wants a session; the other is signed in and can give
 * it one. Whichever shows the code, the signed-out side keeps a *verifier* that
 * never leaves it and only that holder can collect the one-time token the server
 * mints on approval. A code on a screen, or in a photo of one, is therefore not a
 * key: it names a pairing, and a person on the signed-in phone still has to look at
 * who is asking and say yes.
 */

/** How often a waiting side asks the server what became of its code. */
export const POLL_INTERVAL_MS = 1500;

const PREFIX = 'ping-login';
const VERSION = '1';

/** What a code names. `web` carries only the pairing; `phone` also carries the secret to join it. */
export type QrTarget =
  | { mode: 'web'; id: string }
  | { mode: 'phone'; id: string; nonce: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NONCE = /^[A-Za-z0-9_-]{22,64}$/;

/** Far past any real code, so the parser never chews on whatever a camera was pointed at. */
const MAX_PAYLOAD = 200;

export function qrPayload(target: QrTarget): string {
  return target.mode === 'web'
    ? `${PREFIX}:${VERSION}:w:${target.id}`
    : `${PREFIX}:${VERSION}:p:${target.id}.${target.nonce}`;
}

/**
 * What a scanned string means to us, or null. Strict on purpose: a camera reads
 * every QR code in view — posters, tickets, a stranger's — and only one exact
 * shape may reach the server.
 */
export function readQrPayload(text: unknown): QrTarget | null {
  if (typeof text !== 'string' || text.length > MAX_PAYLOAD) return null;

  const parts = text.split(':');
  if (parts.length !== 4 || parts[0] !== PREFIX || parts[1] !== VERSION) return null;
  const [, , mode, body] = parts;

  if (mode === 'w') return UUID.test(body) ? { mode: 'web', id: body.toLowerCase() } : null;

  if (mode === 'p') {
    const pieces = body.split('.');
    if (pieces.length !== 2) return null;
    const [id, nonce] = pieces;
    return UUID.test(id) && NONCE.test(nonce) ? { mode: 'phone', id: id.toLowerCase(), nonce } : null;
  }
  return null;
}

/** 256 bits is the floor: the verifier is the only thing standing between a code and a session. */
const VERIFIER_BYTES = 32;

/** The verifier, from random bytes the caller supplies, as unpadded base64url. */
export function verifierFrom(bytes: Uint8Array): string {
  if (bytes.length < VERIFIER_BYTES) throw new Error(`A verifier needs at least ${VERIFIER_BYTES} random bytes`);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * What the server stores in place of the verifier: the SHA-256 of the verifier
 * *string's UTF-8 bytes* — which is what the server hashes when it is shown the
 * verifier, so the two must agree — as lower-case hex. The caller computes the
 * digest; expo-crypto's `digestStringAsync` does exactly this.
 */
export function challengeFrom(sha256: Uint8Array): string {
  if (sha256.length !== 32) throw new Error('A challenge is a SHA-256 digest, 32 bytes');
  return Array.from(sha256, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** What the server calls a pairing. `expired` is how it reports one it will not honour any more. */
export type ServerState = 'pending' | 'claimed' | 'approved' | 'denied' | 'consumed' | 'expired';

/** What a screen shows for it. */
export type PairView = 'waiting' | 'confirm' | 'approved' | 'denied' | 'expired';

/** Anything unrecognised reads as expired: a state this app does not know is not one to act on. */
export function viewOf(state: unknown): PairView {
  switch (state) {
    case 'pending':
      return 'waiting';
    case 'claimed':
      return 'confirm';
    case 'approved':
      return 'approved';
    case 'denied':
      return 'denied';
    default:
      return 'expired';
  }
}

/** Whole seconds until `expiresAt`, never negative, and zero for a date that does not parse. */
export function secondsLeft(expiresAt: string, now: number): number {
  const end = Date.parse(expiresAt);
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - now) / 1000));
}

/** The two digits both screens show so a person can tell the pairing they started from one they were handed. */
export function isMatchCode(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}$/.test(value);
}

export type RequesterDetails = {
  /** What the requesting device calls itself. It chose this string, so it can say anything. */
  label: string | null;
  /** Two letters, from the connection the server saw. */
  country: string | null;
};

const LABEL_MAX = 48;

/**
 * What the approving screen prints about the device that is asking.
 *
 * The label is the requester's own word for itself, so it is cleaned (control
 * characters, runs of space, length) and the screen has to present it as a claim.
 * The country is the one fact here the server observed rather than was told.
 */
export function describeRequester({ label, country }: RequesterDetails): { label: string; country: string | null } {
  const cleaned = (label ?? '').replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
  const shown = cleaned.length > LABEL_MAX ? `${cleaned.slice(0, LABEL_MAX - 1).trimEnd()}…` : cleaned;
  return {
    label: shown || 'Unknown device',
    country: country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : null,
  };
}
