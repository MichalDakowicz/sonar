import { useReminders } from './useReminders';

/** Renders nothing. Exists so the reminder hooks mount only while the reminder is on. */
export function ReminderRunner() {
  useReminders();
  return null;
}
