import type { Ratings } from '@/types/album';

/**
 * The four facets a release is scored on. Radar rates story / acting / ending /
 * enjoyment; these are the music equivalents, and they live in the same jsonb
 * column shape so lib/personalScore is shared verbatim.
 */
export const FACETS: { key: keyof Omit<Ratings, 'overall'>; label: string; hint: string }[] = [
  { key: 'production', label: 'Production', hint: 'Mix, mastering, how it sounds' },
  { key: 'vocals', label: 'Vocals', hint: 'Performance and delivery' },
  { key: 'lyrics', label: 'Lyrics', hint: 'Writing and what it says' },
  { key: 'replay', label: 'Replay', hint: 'How often you come back to it' },
];

export const EMPTY_RATINGS: Ratings = {};

/** Every facet as a number, for a form that needs no undefined branches. */
export type FacetValues = { production: number; vocals: number; lyrics: number; replay: number };

export const EMPTY_FACETS: FacetValues = { production: 0, vocals: 0, lyrics: 0, replay: 0 };

export function toFacetValues(ratings: Ratings | null | undefined): FacetValues {
  return {
    production: ratings?.production ?? 0,
    vocals: ratings?.vocals ?? 0,
    lyrics: ratings?.lyrics ?? 0,
    replay: ratings?.replay ?? 0,
  };
}

/**
 * The average of the facets that were filled in, to one decimal — what the
 * "auto" button on the overall slider writes. Null when nothing is scored yet,
 * so pressing it on an untouched form cannot stamp a 0.0 rating.
 */
export function recalcOverall(facets: FacetValues): number | null {
  const values = Object.values(facets).filter((v) => v > 0);
  if (values.length === 0) return null;
  return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}

/**
 * Drops the zeroes on the way to the database: an unrated facet should be
 * absent from the jsonb, not stored as 0, or personalScore would have to know
 * the difference between "bad" and "not answered".
 */
export function toRatingsPayload(facets: FacetValues, overall: number): Ratings {
  const payload: Ratings = {};
  for (const [key, value] of Object.entries(facets)) {
    if (value > 0) payload[key as keyof FacetValues] = value;
  }
  if (overall > 0) payload.overall = overall;
  return payload;
}

/** True once the payload holds nothing — the signal to delete the rating row. */
export function isEmptyRatings(ratings: Ratings): boolean {
  return Object.values(ratings).every((v) => !v || v <= 0);
}
