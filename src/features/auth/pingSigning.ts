import { requireOptionalNativeModule } from 'expo-modules-core';

import { isGenuine, type PingApp } from '@/lib/pingApps';

/**
 * JS side of modules/ping-signing. Identical in every Ping app.
 *
 * Optional on purpose: the native half is Android-only, so web and Jest get
 * null here, and so does a dev client built before the module existed.
 */
type PingSigningNativeModule = {
  signerDigests: (packageName: string) => string[];
};

const native = requireOptionalNativeModule<PingSigningNativeModule>('PingSigning');

/**
 * Whether the app installed under `app`'s package name is signed with a
 * certificate it ships under (PING.md §9.13).
 *
 * False whenever that cannot be told — no native half in this build, a package
 * that is not there — because a sign-in is never worth handing to an app that
 * was not checked.
 */
export function isGenuineInstall(app: PingApp): boolean {
  if (!native) return false;
  try {
    return isGenuine(app, native.signerDigests(app.androidPackage));
  } catch {
    return false;
  }
}
