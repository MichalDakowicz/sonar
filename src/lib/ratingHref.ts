import { subjectOf } from '@/lib/albumKey';

export type RatingHref =
  | { pathname: '/release/[albumKey]'; params: { albumKey: string } }
  | { pathname: '/rate/[subjectKey]'; params: { subjectKey: string } };

/**
 * Where a rating key opens.
 *
 * One function rather than a conditional at each call site, because there are
 * four of them (the tier board's drop sheet, the share sheet, the feed, a
 * song's own parent link) and a key sent to the wrong screen fails quietly:
 * `release/[albumKey]` would hand a track id to the /albums endpoint and render
 * "not found" instead of the rating that exists.
 */
export function ratingHref(key: string): RatingHref {
  return subjectOf(key) === 'album'
    ? { pathname: '/release/[albumKey]', params: { albumKey: key } }
    : { pathname: '/rate/[subjectKey]', params: { subjectKey: key } };
}
