import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { ensureNotificationPermission, hasNotificationPermission, supportsNotifications } from './notificationSetup';

/**
 * OS-level notification permission, kept honest across a trip to system settings.
 * The only way back from Android's app-info screen is the app foregrounding
 * again, so that is what triggers the re-check.
 *
 * `granted` is `null` while the first check is in flight, so the Settings banner
 * stays quiet rather than flashing "blocked" at someone who allowed it.
 */
export function useNotificationPermission() {
  const [granted, setGranted] = useState<boolean | null>(supportsNotifications ? null : false);

  useEffect(() => {
    let alive = true;
    // Reading the OS is subscribing to an external system, so the state lands in
    // the callback rather than in the effect body — and a check still in flight
    // when the screen closes must not set state on the way out.
    const read = async () => {
      const allowed = await hasNotificationPermission();
      if (alive) setGranted(allowed);
    };
    void read();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void read();
    });
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  /** Ask once, quietly: what turning the reminder on does. */
  const ask = useCallback(async () => {
    const allowed = await ensureNotificationPermission();
    setGranted(allowed);
    return allowed;
  }, []);

  /**
   * Ask, or send the user to system settings when Android has stopped honouring
   * the prompt. What tapping the "blocked" banner does — they have already seen
   * the explanation, so there is nothing left to be gentle about.
   */
  const request = useCallback(async () => {
    const allowed = await ask();
    if (!allowed) await Linking.openSettings().catch(() => undefined);
    return allowed;
  }, [ask]);

  return { granted, ask, request };
}
