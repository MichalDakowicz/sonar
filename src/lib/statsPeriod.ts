import type { Spin } from '@/types/album';

// Time-period scoping for the Stats screen. Sonar's stats have two halves and
// the period only touches one of them: what you *played* is an event with a
// date, so it scopes; what you *own* is a shelf, and narrowing a collection by
// when a sleeve was bought would answer a question nobody asked.
//
// Pure by design: the screen picks an id, this turns it into a bound and a
// trimmed spin log, and the stat builders run unchanged on top.

export type StatsPeriodId = 'all' | '30d' | '90d' | 'year';

export const STATS_PERIODS: { id: StatsPeriodId; label: string; short: string }[] = [
  { id: 'all', label: 'All time', short: 'All time' },
  { id: '30d', label: 'Last 30 days', short: '30 days' },
  { id: '90d', label: 'Last 90 days', short: '90 days' },
  { id: 'year', label: 'This year', short: 'This year' },
];

export function periodShortLabel(id: StatsPeriodId): string {
  return STATS_PERIODS.find((period) => period.id === id)?.short ?? 'All time';
}

/** Inclusive lower bound at 00:00 local, or null for "all time". */
export function periodStart(id: StatsPeriodId, now: Date = new Date()): Date | null {
  if (id === 'all') return null;
  if (id === 'year') return new Date(now.getFullYear(), 0, 1);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  // Inclusive of today, so "last 30 days" is today plus the 29 before it.
  start.setDate(start.getDate() - (id === '30d' ? 29 : 89));
  return start;
}

/** How many days the window spans, for the per-day activity strip. */
export function periodDays(id: StatsPeriodId, now: Date = new Date()): number {
  switch (id) {
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'year':
      return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86_400_000) + 1;
    default:
      return 365;
  }
}

export function scopeSpinsToPeriod(spins: Spin[], start: Date | null): Spin[] {
  if (!start) return spins;
  const from = start.getTime();
  return spins.filter((spin) => {
    const at = new Date(spin.playedAt).getTime();
    return Number.isFinite(at) && at >= from;
  });
}
