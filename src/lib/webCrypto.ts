import { CryptoDigestAlgorithm, digest, getRandomValues, randomUUID } from 'expo-crypto';

/**
 * The slice of WebCrypto supabase-js reaches for when it builds a PKCE pair.
 * Hermes ships no `crypto` global, so without this auth-js draws the verifier
 * from `Math.random` and, finding no `crypto.subtle`, sends the verifier itself
 * as a `plain` challenge — which makes PKCE protect nothing. Identical in every
 * Ping app; the only thing it touches is a global that is missing.
 */
export type WebCryptoSlice = {
  getRandomValues: typeof getRandomValues;
  randomUUID: () => string;
  subtle: { digest: (algorithm: string, data: BufferSource) => Promise<ArrayBuffer> };
};

// WebCrypto's names for the SHA family. expo-crypto also hashes MD5 and friends,
// which WebCrypto does not, so the table is the allow-list.
const SHA: Record<string, CryptoDigestAlgorithm> = {
  'SHA-1': CryptoDigestAlgorithm.SHA1,
  'SHA-256': CryptoDigestAlgorithm.SHA256,
  'SHA-384': CryptoDigestAlgorithm.SHA384,
  'SHA-512': CryptoDigestAlgorithm.SHA512,
};

function subtleDigest(algorithm: string, data: BufferSource): Promise<ArrayBuffer> {
  const known = SHA[algorithm.toUpperCase()];
  if (!known) return Promise.reject(new TypeError(`Unsupported digest algorithm: ${algorithm}`));
  return digest(known, data);
}

export function createWebCrypto(): WebCryptoSlice {
  return { getRandomValues, randomUUID, subtle: { digest: subtleDigest } };
}

/** Defines `crypto` on `target` when it has none. True when it did. */
export function installWebCrypto(target: object = globalThis): boolean {
  if (typeof (target as { crypto?: unknown }).crypto !== 'undefined') return false;
  Object.defineProperty(target, 'crypto', {
    value: createWebCrypto(),
    configurable: true,
    writable: true,
  });
  return true;
}
