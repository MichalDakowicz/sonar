/**
 * What the daily reminder queue should hold, decided without touching Android.
 * Identical in Lidar and Sonar; the wording is each app's own (lib/reminderCopy).
 *
 * The queue is a week of one-shot notifications rather than one repeating
 * trigger. A repeating trigger cannot skip a day, and skipping today is the whole
 * point: a nudge to read that arrives an hour after you logged your pages is the
 * kind of thing people mute the app over.
 */

export type ReminderLine = { title: string; body: string };

export type PlannedReminder = {
  /** `daily-YYYY-MM-DD` — stable, so a rewrite replaces rather than duplicates. */
  id: string;
  at: Date;
  title: string;
  body: string;
};

export type PlanInput = {
  enabled: boolean;
  hour: number;
  minute: number;
  now: Date;
  /** Today already has what the nudge asks for. Drops today's, never a later day's. */
  doneToday: boolean;
  lines: readonly ReminderLine[];
  /** Days ahead to queue, today included. */
  days?: number;
};

/**
 * A week. Foregrounding the app rewrites the queue, so this is how long the nudge
 * keeps going for someone who has stopped opening the app — and past a week of
 * that, going quiet is the right thing for it to do.
 */
export const PLAN_DAYS = 7;

const DAY_MS = 86_400_000;

function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Whole local calendar days since the epoch, so the wording rotates one step per day. */
function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function planDailyReminders({
  enabled,
  hour,
  minute,
  now,
  doneToday,
  lines,
  days = PLAN_DAYS,
}: PlanInput): PlannedReminder[] {
  if (!enabled || lines.length === 0) return [];
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return [];

  const plan: PlannedReminder[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    // Built from local calendar fields, so a clock change in the window moves the
    // instant rather than the time of day on the wall.
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute, 0, 0);
    if (at.getTime() <= now.getTime()) continue;
    if (offset === 0 && doneToday) continue;

    const line = lines[dayNumber(at) % lines.length];
    plan.push({ id: `daily-${localDayKey(at)}`, at, title: line.title, body: line.body });
  }
  return plan;
}

/** Equal for plans that would leave Android's queue the same, so those are not rewritten. */
export function planFingerprint(plan: readonly PlannedReminder[]): string {
  return plan.map((item) => `${item.id}@${item.at.getTime()}:${item.title}|${item.body}`).join('\n');
}
