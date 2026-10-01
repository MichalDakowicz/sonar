/**
 * What the `qr-login` function says back, checked before anything acts on it.
 *
 * The function is ours, but a screen that trusts its answers blindly turns a
 * redeployed or half-failed server into a crash, or worse into a token handed to the
 * wrong place. Every reader returns null for anything it does not recognise, and the
 * caller treats null as a failure.
 */
import { describeRequester, isMatchCode, qrPayload, readQrPayload, type RequesterDetails } from './qrLogin';

type Fields = Record<string, unknown>;

const isFields = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value);
const isTime = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value));

/** What a person is told about the device that is asking. */
export type Requester = ReturnType<typeof describeRequester>;

/** A code the signed-out side asked for (`start`). */
export type Started = { id: string; matchCode: string; expiresAt: string };
/** A code a signed-in phone asked for (`offer`) — and what its QR says. */
export type Offered = Started & { payload: string };
/** The pairing a signed-out device joined by scanning (`join`). */
export type Joined = { matchCode: string; expiresAt: string };

export function readStart(answer: unknown): Started | null {
  if (!isFields(answer) || !isMatchCode(answer.match_code) || !isTime(answer.expires_at)) return null;
  const target = readQrPayload(qrPayload({ mode: 'web', id: String(answer.id) }));
  return target ? { id: target.id, matchCode: answer.match_code, expiresAt: answer.expires_at } : null;
}

export function readOffer(answer: unknown): Offered | null {
  if (!isFields(answer) || !isMatchCode(answer.match_code) || !isTime(answer.expires_at)) return null;
  const payload = qrPayload({ mode: 'phone', id: String(answer.id), nonce: String(answer.nonce) });
  const target = readQrPayload(payload);
  return target ? { id: target.id, payload, matchCode: answer.match_code, expiresAt: answer.expires_at } : null;
}

export function readJoin(answer: unknown): Joined | null {
  if (!isFields(answer) || !isMatchCode(answer.match_code) || !isTime(answer.expires_at)) return null;
  return { matchCode: answer.match_code, expiresAt: answer.expires_at };
}

/** The signed-out side's view of its code (`redeem`). */
export type RequesterStep =
  | { kind: 'showing'; matchCode: string; expiresAt: string }
  | { kind: 'deciding'; matchCode: string; expiresAt: string }
  | { kind: 'token'; tokenHash: string }
  | { kind: 'denied' };

const MAX_TOKEN = 512;

export function readRedeem(answer: unknown): RequesterStep | null {
  if (!isFields(answer)) return null;
  switch (answer.state) {
    case 'pending':
    case 'claimed':
      if (!isMatchCode(answer.match_code) || !isTime(answer.expires_at)) return null;
      return {
        kind: answer.state === 'pending' ? 'showing' : 'deciding',
        matchCode: answer.match_code,
        expiresAt: answer.expires_at,
      };
    case 'approved':
      return typeof answer.token_hash === 'string' && answer.token_hash && answer.token_hash.length <= MAX_TOKEN
        ? { kind: 'token', tokenHash: answer.token_hash }
        : null;
    case 'denied':
      return { kind: 'denied' };
    default:
      return null;
  }
}

/** The signed-in side's view of a pairing (`claim`, `status`). */
export type ApproverStep =
  | { kind: 'showing'; matchCode: string; expiresAt: string }
  | { kind: 'confirm'; matchCode: string; requester: Requester; expiresAt: string }
  | { kind: 'approved' }
  | { kind: 'denied' }
  | { kind: 'expired' };

function requesterOf(value: unknown): Requester {
  const details: RequesterDetails = { label: null, country: null };
  if (isFields(value)) {
    if (typeof value.label === 'string') details.label = value.label;
    if (typeof value.country === 'string') details.country = value.country;
  }
  return describeRequester(details);
}

/** Scanning a browser's code: the answer is already the thing to decide on. */
export function readClaim(answer: unknown): Extract<ApproverStep, { kind: 'confirm' }> | null {
  if (!isFields(answer) || !isMatchCode(answer.match_code) || !isTime(answer.expires_at)) return null;
  return {
    kind: 'confirm',
    matchCode: answer.match_code,
    requester: requesterOf(answer.requester),
    expiresAt: answer.expires_at,
  };
}

export function readStatus(answer: unknown): ApproverStep | null {
  if (!isFields(answer)) return null;
  switch (answer.state) {
    case 'pending':
      if (!isMatchCode(answer.match_code) || !isTime(answer.expires_at)) return null;
      return { kind: 'showing', matchCode: answer.match_code, expiresAt: answer.expires_at };
    case 'claimed':
      return readClaim(answer);
    // The requester collecting the token is the approval, finished.
    case 'approved':
    case 'consumed':
      return { kind: 'approved' };
    case 'denied':
      return { kind: 'denied' };
    case 'expired':
      return { kind: 'expired' };
    default:
      return null;
  }
}
