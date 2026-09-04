// The shape of how you rate, as a curve read every tenth of a star. Lifted
// from Radar, retargeted at album ratings.
//
// A mean says almost nothing about a rater: 3.6 is the average of a generous
// shelf and of a harsh one alike. The distribution is the habit — where the
// mass sits, whether 5s get handed out, whether the bottom half is ever used.
//
// Scores are 0.1-precision on a 0–5 scale (the overall slider), so the curve
// has one point per step, and a score that is not on a step is read down to the
// one below it. Fifty raw tallies drawn straight would be a comb — a shelf
// rated in half stars is ten spikes with nine gaps — so each point carries a
// smoothed density instead. The counts stay exact underneath; only the drawn
// height is smoothed.

import { personalScore } from '@/lib/personalScore';
import type { AlbumRating } from '@/types/album';

/** Distance between two points on the curve, in stars. */
export const RATING_STEP = 0.1;
/** 0.1 … 5.0 */
export const RATING_POINT_COUNT = 50;
/** Spread of one rating, in steps: 0.15 stars either side before it fades out. */
const SMOOTHING_STEPS = 1.5;

export type RatingPoint = {
  /** Where the point sits on the scale: 0.1 … 5. */
  value: number;
  /** Releases that actually landed on this step. */
  count: number;
  /** What the curve is drawn from — this step's count, plus its neighbours', fading. */
  density: number;
};

export type RatingDistributionResult = {
  points: RatingPoint[];
  rated: number;
  average: number | null;
};

/**
 * Which tenth-of-a-star step a score sits on, 1…50, or null when unrated.
 * Rounded down: 3.9 is under four stars, not on it. Anything below the first
 * step still lands on it, because a rating has to be somewhere on the curve.
 */
export function ratingPointIndex(score: number | null | undefined): number | null {
  if (score == null || score <= 0) return null;
  // Scaled before flooring, and nudged past the float error that makes 4.3 * 10
  // come out at 42.99999999999999.
  return Math.min(RATING_POINT_COUNT, Math.max(1, Math.floor(score * 10 + 1e-9)));
}

/** Gaussian spread of each tally into the steps around it. */
function smooth(counts: number[]): number[] {
  const reach = Math.ceil(SMOOTHING_STEPS * 3);
  const twoSigmaSquared = 2 * SMOOTHING_STEPS * SMOOTHING_STEPS;
  return counts.map((_, i) => {
    let total = 0;
    for (let j = Math.max(0, i - reach); j <= Math.min(counts.length - 1, i + reach); j += 1) {
      if (counts[j] === 0) continue;
      const distance = i - j;
      total += counts[j] * Math.exp(-(distance * distance) / twoSigmaSquared);
    }
    return total;
  });
}

/**
 * Every step is returned, empty ones included: the gaps are the point, and a
 * curve that dropped them would compress the axis and lie about the shape.
 */
export function ratingDistribution(ratings: AlbumRating[]): RatingDistributionResult {
  const counts = new Array<number>(RATING_POINT_COUNT).fill(0);
  let sum = 0;
  let rated = 0;

  for (const rating of ratings) {
    const value = personalScore(rating.ratings);
    const index = ratingPointIndex(value);
    if (index == null || value == null) continue;
    counts[index - 1] += 1;
    sum += value;
    rated += 1;
  }

  const density = smooth(counts);

  return {
    points: counts.map((count, i) => ({
      value: Math.round((i + 1) * RATING_STEP * 10) / 10,
      count,
      density: density[i],
    })),
    rated,
    average: rated === 0 ? null : Math.round((sum / rated) * 10) / 10,
  };
}
