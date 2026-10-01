import type { ReminderLine } from '@/lib/reminderPlan';

/**
 * Everything the daily reminder says in Sonar's voice: the notification itself
 * and the Settings control that switches it on. The mechanics around it are
 * identical in Lidar; only this file differs.
 */

export const REMINDER_TEXT = {
  title: 'Listening reminder',
  description: 'A nudge each evening to put a record on. Skipped on days you have already logged a spin.',
  channelName: 'Listening reminder',
  channelDescription: 'A daily nudge to put a record on',
  /** Shown when the OS has notifications off. */
  blocked: "Android is blocking Sonar's reminders. Tap to allow them.",
  /** Shown where there is no queue to schedule into. */
  needsApp: 'Reminders need the Android app. This switch only takes effect there.',
} as const;

/** One a day, rotating, so a week of the same sentence does not teach anyone to ignore it. */
export const REMINDER_LINES: readonly ReminderLine[] = [
  { title: 'What are you spinning tonight?', body: 'Log a record to keep your listening streak going' },
  { title: 'Time for a record', body: 'Put something on and log the spin' },
  { title: 'Drop the needle', body: 'One album tonight keeps your streak alive' },
  { title: 'Anything on the turntable?', body: 'Log what you are listening to' },
  { title: 'Evening listening', body: 'Pick a record from the shelf' },
];
