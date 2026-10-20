/** Human-entered pairing codes: 80 random bits, no ambiguous I/O/0/1. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const SIGN_IN_CODE_LENGTH = 16;

export function signInCodeFrom(bytes: Uint8Array): string {
  if (bytes.length !== SIGN_IN_CODE_LENGTH) throw new Error('A sign-in code needs 16 random bytes');
  return Array.from(bytes, (byte) => ALPHABET[byte & 31]).join('');
}

export function readSignInCode(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 64) return null;
  const code = value.replace(/[\s-]/g, '').toUpperCase();
  return /^[A-HJ-NP-Z2-9]{16}$/.test(code) ? code : null;
}

export function formatSignInCode(value: string): string {
  return value.match(/.{1,4}/g)?.join('-') ?? value;
}
