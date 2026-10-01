import { CryptoDigestAlgorithm, digest, getRandomBytes } from 'expo-crypto';
import { Platform } from 'react-native';

import { deviceLabel } from '@/lib/qrDeviceLabel';
import { challengeFrom, verifierFrom } from '@/lib/qrLogin';

import { SELF } from '../siblingHandoff';

/**
 * A fresh verifier and the challenge the server keeps in its place. The verifier
 * stays in memory on this device and goes only to `redeem`; the server never sees
 * it until the moment it is used to collect a token.
 */
export async function newVerifier(): Promise<{ verifier: string; challenge: string }> {
  const verifier = verifierFrom(getRandomBytes(32));
  // base64url is ASCII, so its UTF-8 bytes are its character codes — which is what the server hashes.
  const bytes = Uint8Array.from(verifier, (char) => char.charCodeAt(0));
  const hash = await digest(CryptoDigestAlgorithm.SHA256, bytes);
  return { verifier, challenge: challengeFrom(new Uint8Array(hash)) };
}

/** What this device tells the approving phone it is. A claim, shown as one. */
export function thisDevice(): string {
  const agent = Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return deviceLabel(SELF?.name ?? 'Ping', Platform.OS, agent);
}
