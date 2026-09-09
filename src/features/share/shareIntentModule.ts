import { requireOptionalNativeModule, type EventSubscription } from 'expo-modules-core';

/**
 * JS side of modules/share-intent.
 *
 * Optional on purpose: the native half is Android-only, so the web build and
 * the Jest environment both get null here and every call becomes a no-op rather
 * than a crash at import time.
 */

type ShareIntentNativeModule = {
  getSharedText: () => string | null;
  clearSharedText: () => void;
  addListener: (event: 'onSharedText', listener: (payload: { text: string }) => void) => EventSubscription;
};

const native = requireOptionalNativeModule<ShareIntentNativeModule>('ShareIntent');

/** True where a share can actually reach the app. */
export const isShareIntentSupported = !!native;

/** Text shared into the app that JS has not consumed yet. */
export function getSharedText(): string | null {
  return native?.getSharedText() ?? null;
}

/** Consume it, so returning to the app does not reopen the same share. */
export function clearSharedText(): void {
  native?.clearSharedText();
}

/** Shares that arrive while the app is already running. */
export function addSharedTextListener(listener: (text: string) => void): EventSubscription {
  if (!native) return { remove: () => {} };
  return native.addListener('onSharedText', ({ text }) => {
    if (text) listener(text);
  });
}
