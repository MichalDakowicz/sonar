import type { PingAppKey } from './pingApps';

// Update after each sibling's self-hosted release is verified, in the same release
// that enables handoff to it. Old cloud releases cannot redeem local OTP hashes.
export const SELF_HOSTED_PING_APPS: readonly PingAppKey[] = ['lidar', 'sonar', 'pulsar'];

export function canShareSignIn(self: PingAppKey, sibling: PingAppKey): boolean {
  return self !== sibling &&
    SELF_HOSTED_PING_APPS.includes(self) === SELF_HOSTED_PING_APPS.includes(sibling);
}
