import { formatSignInCode, readSignInCode, signInCodeFrom } from './signInCode';

it('uses all 32 symbols without bias or ambiguous characters', () => {
  const low = signInCodeFrom(Uint8Array.from({ length: 16 }, (_, i) => i));
  const high = signInCodeFrom(Uint8Array.from({ length: 16 }, (_, i) => i + 16));
  expect(new Set(low + high).size).toBe(32);
  expect(low + high).not.toMatch(/[IO01]/);
  expect(signInCodeFrom(new Uint8Array(16).fill(255))).toBe('9999999999999999');
  expect(() => signInCodeFrom(new Uint8Array(15))).toThrow();
});

it('accepts typed groups, case and whitespace, rejects comparison digits and payloads', () => {
  expect(readSignInCode(' abcd-efgh jklm-npqr ')).toBe('ABCDEFGHJKLMNPQR');
  expect(formatSignInCode('ABCDEFGHJKLMNPQR')).toBe('ABCD-EFGH-JKLM-NPQR');
  for (const value of ['42', 'ABCDEFGHIJKLMNOP', '1234567890123456', 'A'.repeat(17), {}, null, 'A'.repeat(65)]) {
    expect(readSignInCode(value)).toBeNull();
  }
});
