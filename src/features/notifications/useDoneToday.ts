import { useCallback, useMemo } from 'react';

import { useSpins } from '@/hooks/useSpins';
import { localDateKey } from '@/lib/spins';

/**
 * Whether the listening nudge has already been answered on a given day: any spin
 * logged on it, by the same local-day reckoning as the listening streak.
 *
 * A function of the day rather than a flag for today, so the reminder queue can
 * be rebuilt on a later morning without this hook having re-rendered since.
 */
export function useDoneToday() {
  const { spins, loading, error } = useSpins();

  const days = useMemo(() => new Set(spins.map((spin) => localDateKey(new Date(spin.playedAt)))), [spins]);
  const isDoneOn = useCallback((date: Date) => days.has(localDateKey(date)), [days]);

  // Planning against a log that has not arrived would queue today's reminder for
  // someone who played a record an hour ago, so the queue waits for it.
  const ready = !loading && !error;

  return { ready, isDoneOn };
}
