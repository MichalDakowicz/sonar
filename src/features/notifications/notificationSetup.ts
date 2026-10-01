import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ensureNotificationChannels } from './notificationChannels';

// The one place setNotificationHandler is called. It is a global, last-write-wins
// registration, so a second module setting its own would silently decide the
// behaviour of every notification in the app.

export const supportsNotifications = Platform.OS !== 'web';

if (supportsNotifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // Every notification the app schedules is a nudge, so all of them are banners.
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Asks once for POST_NOTIFICATIONS (Android 13+), creating the channel first so
 * the system prompt has something to describe. A refusal is never fatal — the
 * app works the same without a single reminder.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!supportsNotifications) return false;
  try {
    await ensureNotificationChannels();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch (error) {
    console.warn('Notification permission check failed', error);
    return false;
  }
}

/** Whether notifications are already allowed, without prompting for them. */
export async function hasNotificationPermission(): Promise<boolean> {
  if (!supportsNotifications) return false;
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}
