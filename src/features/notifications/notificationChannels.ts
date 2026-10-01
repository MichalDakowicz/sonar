import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { REMINDER_TEXT } from '@/lib/reminderCopy';

// Android routes every notification through a channel, and the channel — not the
// message — owns whether it makes a sound or vibrates. One channel is enough
// here: it is what lets someone mute the daily nudge from system settings without
// the app needing a switch for it.

export const REMINDER_CHANNEL = 'reminders';

/** Sonar's emerald. A notification colour has to be a literal hex, so it cannot come from theme/colors. */
export const NOTIFICATION_ACCENT = '#10b981';

let ready: Promise<void> | null = null;

/**
 * Create the channel. Idempotent both here (the promise is memoized) and in
 * Android, where re-declaring a channel only updates its name and description —
 * importance is frozen after first creation, because it belongs to the user once
 * they have touched it.
 */
export function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  ready ??= Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: REMINDER_TEXT.channelName,
    description: REMINDER_TEXT.channelDescription,
    importance: Notifications.AndroidImportance.DEFAULT,
    showBadge: false,
    lightColor: NOTIFICATION_ACCENT,
  })
    .then(() => undefined)
    .catch((error) => {
      // A failed channel is not worth blocking anything over; the reminder still
      // lands, just on Android's default channel.
      console.warn('Could not create the notification channel', error);
      ready = null;
    });
  return ready;
}
