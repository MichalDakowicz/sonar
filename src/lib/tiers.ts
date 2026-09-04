import { personalScore } from '@/lib/personalScore';
import type { AlbumRating } from '@/types/album';

/**
 * The tier list.
 *
 * A tier is **derived from the score, never stored**. The score is the truth —
 * it drives the stats, the sort and the curve — so a tier column would be a
 * second copy of the same fact, free to disagree with it. Dropping an album into
 * a tier therefore writes a score, and the board re-reads which band that score
 * falls in.
 *
 * `score` is what a drop assigns: the value a person means when they say "this
 * is an A". The bands are contiguous and cover 0–5 with no gaps, so every rating
 * lands in exactly one row.
 */
export type TierId = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export type Tier = {
  id: TierId;
  label: string;
  /** Inclusive lower bound of the band. */
  min: number;
  /** What dropping an album here sets the overall to. */
  score: number;
  color: string;
  tint: string;
};

export const TIERS: Tier[] = [
  { id: 'S', label: 'S', min: 4.5, score: 5, color: '#f472b6', tint: 'rgba(244,114,182,0.14)' },
  { id: 'A', label: 'A', min: 4, score: 4.2, color: '#fb923c', tint: 'rgba(251,146,60,0.14)' },
  { id: 'B', label: 'B', min: 3.5, score: 3.7, color: '#fbbf24', tint: 'rgba(251,191,36,0.14)' },
  { id: 'C', label: 'C', min: 3, score: 3.2, color: '#34d399', tint: 'rgba(52,211,153,0.14)' },
  { id: 'D', label: 'D', min: 2, score: 2.5, color: '#60a5fa', tint: 'rgba(96,165,250,0.14)' },
  { id: 'F', label: 'F', min: 0, score: 1, color: '#a78bfa', tint: 'rgba(167,139,250,0.14)' },
];

const BY_ID = new Map(TIERS.map((tier) => [tier.id, tier]));

export function tierMeta(id: TierId): Tier {
  return BY_ID.get(id) ?? TIERS[TIERS.length - 1];
}

/** Which band a score sits in, or null when there is no score at all. */
export function tierFor(score: number | null | undefined): TierId | null {
  if (score == null || score <= 0) return null;
  // Descending bounds, so the first band the score clears is its band.
  return (TIERS.find((tier) => score >= tier.min) ?? TIERS[TIERS.length - 1]).id;
}

export function scoreForTier(id: TierId): number {
  return tierMeta(id).score;
}

export type TierRow = { tier: Tier; ratings: AlbumRating[] };

/**
 * Every tier, in order, with the ratings that fall in it — empty rows included.
 * An empty S row is information (nothing has earned it yet) and is also the
 * target you need to see in order to drop something into it.
 *
 * Within a row, highest score first, then title, so the order is stable across
 * renders and reads as a ranking rather than as insertion order.
 */
export function groupByTier(ratings: AlbumRating[]): TierRow[] {
  const buckets = new Map<TierId, AlbumRating[]>(TIERS.map((tier) => [tier.id, []]));

  for (const rating of ratings) {
    const id = tierFor(personalScore(rating.ratings));
    if (id) buckets.get(id)!.push(rating);
  }

  for (const list of buckets.values()) {
    list.sort((a, b) => {
      const diff = (personalScore(b.ratings) ?? 0) - (personalScore(a.ratings) ?? 0);
      return diff !== 0 ? diff : a.title.localeCompare(b.title);
    });
  }

  return TIERS.map((tier) => ({ tier, ratings: buckets.get(tier.id)! }));
}

/** Ratings with a review attached — the ones with something to read. */
export function withReviews(ratings: AlbumRating[]): AlbumRating[] {
  return ratings.filter((rating) => rating.review.trim().length > 0);
}
