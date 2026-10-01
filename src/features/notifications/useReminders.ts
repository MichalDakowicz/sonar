import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { REMINDER_LINES } from '@/lib/reminderCopy';
import { planDailyReminders } from '@/lib/reminderPlan';
import { useReminderPrefs } from '@/store/reminderPrefs';

import { syncReminders } from './reminderScheduler';
import { useDoneToday } from './useDoneToday';

/**
 * Keeps Android's reminder queue in step with the preference and with what has
 * been done today. Identical in Lidar and Sonar; `useDoneToday` is the app's own.
 *
 * Mounted only while the reminder is on and someone is signed in (ReminderSync),
 * so it is not reading the ledger for people who never asked for a nudge.
 */
export function useReminders() {
  const { hour, minute } = useReminderPrefs();
  const { ready, isDoneOn } = useDoneToday();

  // Built from the clock at the moment it runs. A plan memoised on its inputs
  // would be a day old by the next time the app foregrounds.
  const build = useCallback(() => {
    const now = new Date();
    return planDailyReminders({
      enabled: true,
      hour,
      minute,
      now,
      doneToday: isDoneOn(now),
      lines: REMINDER_LINES,
    });
  }, [hour, minute, isDoneOn]);

  useEffect(() => {
    if (ready) void syncReminders(build());
  }, [ready, build]);

  // A reboot drains the queue without telling anyone, and a plan whose window has
  // rolled past is stale rather than different. Foregrounding is the one moment
  // both are cheap to fix, so it forces a rewrite from a fresh clock.
  const buildRef = useRef(build);
  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    if (!ready) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncReminders(buildRef.current(), true);
    });
    return () => subscription.remove();
  }, [ready]);
}
