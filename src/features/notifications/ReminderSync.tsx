import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useReminderPrefs } from '@/store/reminderPrefs';

import { ensureNotificationChannels } from './notificationChannels';
import { supportsNotifications } from './notificationSetup';
import { ReminderRunner } from './ReminderRunner';
import { clearReminders } from './reminderScheduler';

/**
 * Renders nothing. Mounted from the root layout so the queue is kept in step on
 * every route, not only on Settings: logging pages from a book page has to be
 * able to retract tonight's nudge.
 *
 * Off, or signed out, leaves nothing queued — a reminder must not outlive the
 * switch, or the account it was planned for.
 */
export function ReminderSync() {
  const { user } = useAuth();
  const enabled = useReminderPrefs((state) => state.enabled);

  // Channel first and unconditionally: Android shows its name in the system
  // permission sheet, so creating it after the prompt describes nothing.
  useEffect(() => {
    if (supportsNotifications) void ensureNotificationChannels();
  }, []);

  const live = !!user && enabled;
  useEffect(() => {
    if (!live) void clearReminders();
  }, [live]);

  return live ? <ReminderRunner /> : null;
}
