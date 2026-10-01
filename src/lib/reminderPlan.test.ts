import { PLAN_DAYS, planDailyReminders, planFingerprint, type ReminderLine } from './reminderPlan';

const LINES: ReminderLine[] = [
  { title: 'A', body: 'a' },
  { title: 'B', body: 'b' },
  { title: 'C', body: 'c' },
];

// A Thursday at noon, local time.
const NOON = new Date(2026, 9, 1, 12, 0, 0);

const base = { enabled: true, hour: 20, minute: 0, now: NOON, doneToday: false, lines: LINES };

describe('planDailyReminders', () => {
  it('queues a week, today first, at the chosen time of day', () => {
    const plan = planDailyReminders(base);
    expect(plan).toHaveLength(PLAN_DAYS);
    expect(plan[0].at).toEqual(new Date(2026, 9, 1, 20, 0));
    expect(plan[6].at).toEqual(new Date(2026, 9, 7, 20, 0));
  });

  it('queues nothing when switched off, or with nothing to say', () => {
    expect(planDailyReminders({ ...base, enabled: false })).toEqual([]);
    expect(planDailyReminders({ ...base, lines: [] })).toEqual([]);
  });

  it('starts tomorrow once today’s time has gone by', () => {
    const plan = planDailyReminders({ ...base, now: new Date(2026, 9, 1, 21, 30) });
    expect(plan[0].at).toEqual(new Date(2026, 9, 2, 20, 0));
    expect(plan).toHaveLength(PLAN_DAYS - 1);
  });

  it('does not queue a reminder for the minute it is already', () => {
    const plan = planDailyReminders({ ...base, now: new Date(2026, 9, 1, 20, 0, 0) });
    expect(plan[0].at).toEqual(new Date(2026, 9, 2, 20, 0));
  });

  it('drops today when it is already done, but never a later day', () => {
    const plan = planDailyReminders({ ...base, doneToday: true });
    expect(plan[0].at).toEqual(new Date(2026, 9, 2, 20, 0));
    expect(plan).toHaveLength(PLAN_DAYS - 1);
  });

  it('does not let a done day that has already passed remove tomorrow', () => {
    const plan = planDailyReminders({ ...base, doneToday: true, now: new Date(2026, 9, 1, 21, 0) });
    expect(plan[0].at).toEqual(new Date(2026, 9, 2, 20, 0));
  });

  it('honours minutes', () => {
    const plan = planDailyReminders({ ...base, hour: 7, minute: 45 });
    expect(plan[0].at).toEqual(new Date(2026, 9, 2, 7, 45));
  });

  it('gives each day its own stable id', () => {
    const ids = planDailyReminders(base).map((item) => item.id);
    expect(ids[0]).toBe('daily-2026-10-01');
    expect(new Set(ids).size).toBe(PLAN_DAYS);
  });

  it('rotates the wording a step a day, the same way whenever it is planned', () => {
    const today = planDailyReminders(base);
    const titles = today.map((item) => item.title);
    expect(titles[0]).not.toBe(titles[1]);
    expect(titles[0]).toBe(titles[3]);

    const later = planDailyReminders({ ...base, now: new Date(2026, 9, 2, 12, 0) });
    expect(later[0].title).toBe(titles[1]);
  });

  it('crosses a month end', () => {
    const plan = planDailyReminders({ ...base, now: new Date(2026, 9, 30, 12, 0) });
    expect(plan.map((item) => item.id).slice(0, 3)).toEqual(['daily-2026-10-30', 'daily-2026-10-31', 'daily-2026-11-01']);
  });

  it('queues nothing for a time that is not a time', () => {
    expect(planDailyReminders({ ...base, hour: Number.NaN })).toEqual([]);
    expect(planDailyReminders({ ...base, minute: 1.5 })).toEqual([]);
  });

  it('honours a shorter window', () => {
    expect(planDailyReminders({ ...base, days: 2 })).toHaveLength(2);
  });
});

describe('planFingerprint', () => {
  it('is equal for plans that leave the queue the same', () => {
    expect(planFingerprint(planDailyReminders(base))).toBe(planFingerprint(planDailyReminders(base)));
  });

  it('changes with the time, the day, or the wording', () => {
    const plan = planFingerprint(planDailyReminders(base));
    expect(planFingerprint(planDailyReminders({ ...base, minute: 15 }))).not.toBe(plan);
    expect(planFingerprint(planDailyReminders({ ...base, doneToday: true }))).not.toBe(plan);
    expect(planFingerprint(planDailyReminders({ ...base, lines: [{ title: 'Z', body: 'z' }] }))).not.toBe(plan);
  });
});
