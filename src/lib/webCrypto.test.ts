import { createWebCrypto, installWebCrypto } from './webCrypto';

// Required rather than imported: not every Ping app carries @types/node.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createHash } = require('node:crypto');

// expo-crypto's natives are not in Jest; Node's WebCrypto stands in for them.
jest.mock('expo-crypto', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const node = require('node:crypto').webcrypto;
  return {
    CryptoDigestAlgorithm: {
      SHA1: 'SHA-1',
      SHA256: 'SHA-256',
      SHA384: 'SHA-384',
      SHA512: 'SHA-512',
      MD5: 'MD5',
    },
    getRandomValues: <T extends ArrayBufferView>(array: T) => node.getRandomValues(array),
    randomUUID: () => node.randomUUID(),
    digest: (algorithm: string, data: BufferSource) => node.subtle.digest(algorithm, data),
  };
});

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

describe('installWebCrypto', () => {
  it('defines crypto on a runtime that has none', () => {
    const target: { crypto?: unknown } = {};
    expect(installWebCrypto(target)).toBe(true);
    expect(target.crypto).toBeDefined();
  });

  it('leaves an existing crypto alone', () => {
    const existing = {};
    const target = { crypto: existing };
    expect(installWebCrypto(target)).toBe(false);
    expect(target.crypto).toBe(existing);
  });
});

describe('createWebCrypto', () => {
  const crypto = createWebCrypto();

  it('fills integer arrays in place', () => {
    const array = new Uint32Array(56);
    expect(crypto.getRandomValues(array)).toBe(array);
    expect(array.some((n) => n !== 0)).toBe(true);
  });

  it('digests with the SHA names WebCrypto uses', async () => {
    const hashed = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('abc'));
    // FIPS 180-2 test vector.
    expect(hex(hashed)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('rejects an algorithm WebCrypto does not have', async () => {
    await expect(crypto.subtle.digest('MD5', new Uint8Array(1))).rejects.toThrow(TypeError);
  });
});

describe('supabase-js PKCE on a runtime with no crypto global', () => {
  // The real helper, so this fails if supabase-js ever stops finding what we install.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCodeChallengeAndMethod } = require('@supabase/auth-js/dist/main/lib/helpers');

  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  beforeEach(() => {
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true, writable: true });
  });
  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'crypto', original);
    else delete (globalThis as { crypto?: unknown }).crypto;
  });

  const memory = () => {
    const items = new Map<string, string>();
    return {
      items,
      getItem: async (key: string) => items.get(key) ?? null,
      setItem: async (key: string, value: string) => void items.set(key, value),
      removeItem: async (key: string) => void items.delete(key),
    };
  };

  it('starts with no crypto, as Hermes does', () => {
    expect(typeof globalThis.crypto).toBe('undefined');
  });

  it('sends an s256 challenge of the stored verifier once installed', async () => {
    installWebCrypto();
    const storage = memory();

    const [challenge, method] = await getCodeChallengeAndMethod(storage, 'sb');

    // auth-js stores it JSON-encoded.
    const verifier = JSON.parse(storage.items.get('sb-code-verifier')!);
    expect(method).toBe('s256');
    expect(challenge).not.toBe(verifier);
    expect(challenge).toBe(base64url(createHash('sha256').update(verifier).digest()));
  });

  it('draws a different verifier every time', async () => {
    installWebCrypto();
    const storage = memory();
    await getCodeChallengeAndMethod(storage, 'a');
    await getCodeChallengeAndMethod(storage, 'b');
    expect(storage.items.get('a-code-verifier')).not.toBe(storage.items.get('b-code-verifier'));
  });
});
