import type { Ratings } from '@/types/album';

/**
 * The one overall-or-average score rule, lifted from Radar unchanged (its
 * films use the same jsonb shape). Lives here rather than beside the stars
 * component so anything that is not a React tree — the stats builders, a node
 * script — can read a score without importing react-native.
 *
 * An explicit overall wins; otherwise the facets that were actually filled in
 * are averaged, so a half-finished rating still produces a number.
 */
export function personalScore(ratings: Ratings | null | undefined): number | null {
  if (!ratings) return null;
  if (ratings.overall && ratings.overall > 0) return ratings.overall;

  const { overall: _overall, ...facets } = ratings;
  const values = Object.values(facets).filter((v): v is number => typeof v === 'number' && v > 0);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** True when a rating row holds anything worth showing. */
export function hasScore(ratings: Ratings | null | undefined): boolean {
  return personalScore(ratings) !== null;
}
