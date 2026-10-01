/**
 * The time of day a reminder lands, and the arithmetic the Settings stepper does
 * on it. Identical in Lidar and Sonar.
 */

export type TimeOfDay = { hour: number; minute: number };

/** Evening, when a nudge to read or to put a record on can still be acted on. */
export const DEFAULT_TIME: TimeOfDay = { hour: 20, minute: 0 };

/** Quarter hours: finer than anyone's evening, coarse enough to reach with a thumb. */
export const MINUTE_STEP = 15;

/** Whole numbers inside a day, with anything unreadable falling back to the default. */
export function clampTime({ hour, minute }: TimeOfDay): TimeOfDay {
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return DEFAULT_TIME;
  return {
    hour: Math.min(23, Math.max(0, Math.round(hour))),
    minute: Math.min(59, Math.max(0, Math.round(minute))),
  };
}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}

/**
 * Move the hour, wrapping past midnight both ways. A dial that stopped at 23 would
 * make a late-night reminder harder to reach than a morning one.
 */
export function stepHour(time: TimeOfDay, delta: number): TimeOfDay {
  return { hour: wrap(time.hour + delta, 24), minute: time.minute };
}

/**
 * Move the minute a quarter at a time, wrapping within the hour like a clock face.
 * The hour is left alone: stepping 45 → 00 should not also move the evening on by
 * an hour behind the person's thumb.
 */
export function stepMinute(time: TimeOfDay, direction: 1 | -1): TimeOfDay {
  return { hour: time.hour, minute: wrap(time.minute + direction * MINUTE_STEP, 60) };
}

/** `20:05` — twenty-four hour, the way the rest of the app writes a time. */
export function formatTime({ hour, minute }: TimeOfDay): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
