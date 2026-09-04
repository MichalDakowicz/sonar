import { useMemo } from 'react';

import { personalScore } from '@/lib/personalScore';
import { ratingDistribution } from '@/lib/ratingDistribution';
import { listeningStreak, spinsPerDay } from '@/lib/spins';
import { computeStats, type CollectionStats } from '@/lib/stats';
import { periodDays, periodStart, scopeSpinsToPeriod, type StatsPeriodId } from '@/lib/statsPeriod';
import type { Album, AlbumRating, Spin } from '@/types/album';
import type { RatingDistributionResult } from '@/lib/ratingDistribution';

export type StatsBundle = {
  stats: CollectionStats;
  distribution: RatingDistributionResult;
  perDay: { date: string; count: number }[];
  streak: number;
  /** Spins inside the window — the headline "plays" number. */
  periodSpins: number;
};

/**
 * Everything the Stats screen reads, in one memo chain.
 *
 * The period scopes the spin log only. The collection is a shelf, not a stream
 * of events: narrowing "records owned" by when a sleeve was bought would answer
 * a question nobody asked, and would make the format split and total value
 * jump around as the window changes.
 */
export function useStats({
  albums,
  spins,
  ratings,
  period,
}: {
  albums: Album[];
  spins: Spin[];
  ratings: AlbumRating[];
  period: StatsPeriodId;
}): StatsBundle {
  const scopedSpins = useMemo(() => scopeSpinsToPeriod(spins, periodStart(period)), [spins, period]);

  const stats = useMemo(
    () => computeStats({ albums, spins: scopedSpins, ratings, scoreOf: (rating) => personalScore(rating.ratings) }),
    [albums, scopedSpins, ratings],
  );

  const distribution = useMemo(() => ratingDistribution(ratings), [ratings]);

  // The strip is capped at 90 columns: a year of days is unreadable at phone
  // width, and "this year" is the only period that can exceed it.
  const perDay = useMemo(() => spinsPerDay(scopedSpins, Math.min(periodDays(period), 90)), [scopedSpins, period]);

  // The streak reads the whole log, never the window: a run of listening days
  // does not restart because you changed the period picker.
  const streak = useMemo(() => listeningStreak(spins), [spins]);

  return { stats, distribution, perDay, streak, periodSpins: scopedSpins.length };
}
