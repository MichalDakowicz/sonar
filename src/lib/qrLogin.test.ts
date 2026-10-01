import {
  challengeFrom,
  describeRequester,
  isMatchCode,
  qrPayload,
  readQrPayload,
  secondsLeft,
  verifierFrom,
  viewOf,
} from './qrLogin';

const ID = '3f2b8c1e-9d4a-4e6b-8a17-0c5d2e9f7a31';
const NONCE = 'q7Zx2mKd9Pv4Lw8TnBc3Ra'; // 22 chars: 128 bits of base64url

describe('the code on the screen', () => {
  it('round-trips a web code, which names only the pairing', () => {
    const text = qrPayload({ mode: 'web', id: ID });
    expect(text).toBe(`ping-login:1:w:${ID}`);
    expect(readQrPayload(text)).toEqual({ mode: 'web', id: ID });
  });

  it('round-trips a phone code, which also carries the secret to join', () => {
    const text = qrPayload({ mode: 'phone', id: ID, nonce: NONCE });
    expect(text).toBe(`ping-login:1:p:${ID}.${NONCE}`);
    expect(readQrPayload(text)).toEqual({ mode: 'phone', id: ID, nonce: NONCE });
  });

  it('reads an upper-case id as the lower-case one the server uses', () => {
    expect(readQrPayload(`ping-login:1:w:${ID.toUpperCase()}`)).toEqual({ mode: 'web', id: ID });
  });

  it.each([
    ['not a string', 42],
    ['nothing', undefined],
    ['an empty string', ''],
    ['a web address', 'https://example.com/login'],
    ['another app’s code', `other-login:1:w:${ID}`],
    ['a newer version', `ping-login:2:w:${ID}`],
    ['an unknown mode', `ping-login:1:x:${ID}`],
    ['a web code with a secret on it', `ping-login:1:w:${ID}.${NONCE}`],
    ['a phone code with no secret', `ping-login:1:p:${ID}`],
    ['a phone code with a short secret', `ping-login:1:p:${ID}.abc`],
    ['a phone code with a secret that is not base64url', `ping-login:1:p:${ID}.${'!'.repeat(22)}`],
    ['an id that is not a uuid', 'ping-login:1:w:not-a-uuid'],
    ['an extra segment', `ping-login:1:w:${ID}:extra`],
    ['trailing whitespace', `ping-login:1:w:${ID} `],
    ['an oversized payload', `ping-login:1:p:${ID}.${'a'.repeat(5000)}`],
  ])('refuses %s', (_name, text) => {
    expect(readQrPayload(text)).toBeNull();
  });
});

describe('verifierFrom', () => {
  it('writes unpadded base64url', () => {
    const verifier = verifierFrom(new Uint8Array(32).fill(251));
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('changes with the bytes', () => {
    expect(verifierFrom(new Uint8Array(32).fill(1))).not.toBe(verifierFrom(new Uint8Array(32).fill(2)));
  });

  it('refuses fewer than 32 bytes, which is not enough to keep a session safe', () => {
    expect(() => verifierFrom(new Uint8Array(31))).toThrow();
  });
});

describe('challengeFrom', () => {
  it('writes a digest as lower-case hex', () => {
    expect(challengeFrom(new Uint8Array(32).fill(255))).toBe('f'.repeat(64));
    expect(challengeFrom(new Uint8Array(32))).toBe('0'.repeat(64));
  });

  it('refuses anything that is not a SHA-256 digest', () => {
    expect(() => challengeFrom(new Uint8Array(20))).toThrow();
  });
});

describe('viewOf', () => {
  it('maps what the server says to what a screen shows', () => {
    expect(viewOf('pending')).toBe('waiting');
    expect(viewOf('claimed')).toBe('confirm');
    expect(viewOf('approved')).toBe('approved');
    expect(viewOf('denied')).toBe('denied');
    expect(viewOf('expired')).toBe('expired');
    expect(viewOf('consumed')).toBe('expired');
  });

  it('treats a state it does not know as expired rather than acting on it', () => {
    expect(viewOf('teleported')).toBe('expired');
    expect(viewOf(undefined)).toBe('expired');
    expect(viewOf(null)).toBe('expired');
  });
});

describe('secondsLeft', () => {
  const now = Date.parse('2026-10-01T12:00:00.000Z');

  it('counts whole seconds up, so a fresh code never reads as zero', () => {
    expect(secondsLeft('2026-10-01T12:01:00.000Z', now)).toBe(60);
    expect(secondsLeft('2026-10-01T12:00:00.400Z', now)).toBe(1);
  });

  it('is zero once it has passed, or when the date is unreadable', () => {
    expect(secondsLeft('2026-10-01T11:59:00.000Z', now)).toBe(0);
    expect(secondsLeft('soon', now)).toBe(0);
  });
});

describe('isMatchCode', () => {
  it('is exactly two digits', () => {
    expect(isMatchCode('07')).toBe(true);
    expect(isMatchCode('42')).toBe(true);
    expect(isMatchCode('7')).toBe(false);
    expect(isMatchCode('123')).toBe(false);
    expect(isMatchCode('4a')).toBe(false);
    expect(isMatchCode(42)).toBe(false);
  });
});

describe('describeRequester', () => {
  it('shows a plain label and an upper-cased country', () => {
    expect(describeRequester({ label: 'Chrome on Windows', country: 'pl' })).toEqual({
      label: 'Chrome on Windows',
      country: 'PL',
    });
  });

  it('falls back when there is no label', () => {
    expect(describeRequester({ label: null, country: null })).toEqual({ label: 'Unknown device', country: null });
    expect(describeRequester({ label: '   ', country: null }).label).toBe('Unknown device');
  });

  it('strips control characters and collapses space, since the device wrote it', () => {
    expect(describeRequester({ label: 'Pixel\n\t 8\u0000  Pro', country: null }).label).toBe('Pixel 8 Pro');
  });

  it('cuts a long label short', () => {
    const { label } = describeRequester({ label: 'x'.repeat(200), country: null });
    expect(label.length).toBeLessThanOrEqual(48);
    expect(label.endsWith('…')).toBe(true);
  });

  it('drops a country that is not two letters', () => {
    expect(describeRequester({ label: 'a', country: 'Poland' }).country).toBeNull();
    expect(describeRequester({ label: 'a', country: 'P1' }).country).toBeNull();
    expect(describeRequester({ label: 'a', country: '' }).country).toBeNull();
  });
});
