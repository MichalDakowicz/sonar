import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { planFingerprint, type PlannedReminder } from '@/lib/reminderPlan';

import { ensureNotificationChannels, NOTIFICATION_ACCENT, REMINDER_CHANNEL } from './notificationChannels';
import { hasNotificationPermission, supportsNotifications } from './notificationSetup';

/**
 * Puts a plan into Android's queue. The only module that talks to
 * expo-notifications about scheduling; deciding *what* to schedule is pure and
 * lives in lib/reminderPlan.
 *
 * The app schedules nothing else, so cancelling the whole queue before laying a
 * new one down is safe — and it is the only way to retract today's reminder once
 * today's reading has been logged.
 */

/** The queue as last written, so an unchanged plan is not torn down and rebuilt. */
let current: string | null = null;

async function schedule(item: PlannedReminder): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: item.id,
    content: { title: item.title, body: item.body, color: NOTIFICATION_ACCENT },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: item.at,
      ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL } : null),
    },
  });
}

/**
 * Rewrite the queue to match `plan`. Returns how many reminders are now pending,
 * or 0 when the platform or the user has said no.
 *
 * `force` skips the unchanged-plan shortcut, for the case where the queue was
 * drained behind our back — a reboot, or the user clearing notifications.
 */
export async function syncReminders(plan: PlannedReminder[], force = false): Promise<number> {
  if (!supportsNotifications) return 0;

  // Permission is checked rather than requested: rescheduling happens in the
  // background whenever a page is logged, and a permission sheet has no business
  // appearing because somebody saved a bookmark.
  if (!(await hasNotificationPermission())) {
    current = null;
    return 0;
  }

  const fingerprint = planFingerprint(plan);
  if (!force && fingerprint === current) return plan.length;

  try {
    await ensureNotificationChannels();
    await Notifications.cancelAllScheduledNotificationsAsync();
    // Sequentially, not Promise.all: the queue is small and bounded, and a burst
    // of parallel native calls is how the last few silently get dropped.
    for (const item of plan) await schedule(item);
    current = fingerprint;
    return plan.length;
  } catch (error) {
    // A failed reschedule must not take a save down with it. The queue is rebuilt
    // on the next foreground anyway, so the cost is one missed nudge.
    console.warn('Could not reschedule reminders', error);
    current = null;
    return 0;
  }
}

/** Empty the queue — what turning the reminder off, or signing out, has to do. */
export async function clearReminders(): Promise<void> {
  if (!supportsNotifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Could not clear reminders', error);
  }
  current = null;
}
