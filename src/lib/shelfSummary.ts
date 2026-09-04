// The three numbers and two rails at the top of a shelf — yours on Profile,
// a friend's on their shelf screen. One builder, so the two never disagree.

import { isOwned } from '@/lib/albumStatus';
import { personalScore } from '@/lib/personalScore';
import type { Album, AlbumRating, Spin } from '@/types/album';

export type ShelfStats = {
  /** Records owned — wishlist and pre-orders excluded. */
  albums: number;
  /** Of those, the ones added in the current calendar year. */
  thisYear: number;
  /** Mean of every score they have given, or null if they rate nothing. */
  average: number | null;
};

function time(value: string | null | undefined): number {
  const parsed = Date.parse(value ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function shelfStats(albums: Album[], ratings: AlbumRating[], now: Date = new Date()): ShelfStats {
  const year = now.getFullYear();
  let owned = 0;
  let thisYear = 0;

  for (const album of albums) {
    if (!isOwned(album)) continue;
    owned += 1;
    const at = time(album.addedAt);
    if (at && new Date(at).getFullYear() === year) thisYear += 1;
  }

  let total = 0;
  let scored = 0;
  for (const rating of ratings) {
    const score = personalScore(rating.ratings);
    if (score != null && score > 0) {
      total += score;
      scored += 1;
    }
  }

  return {
    albums: owned,
    thisYear,
    average: scored === 0 ? null : Math.round((total / scored) * 10) / 10,
  };
}

/** Newest additions first — the poster rail under the header. */
export function recentlyAdded(albums: Album[], limit = 12): Album[] {
  return [...albums].sort((a, b) => time(b.addedAt) - time(a.addedAt)).slice(0, limit);
}

/**
 * What they have had on lately. Reads the spin log rather than
 * albums.last_listened_at when it is available — the log is the source of
 * truth, the column is only its mirror.
 */
export function nowPlaying(albums: Album[], spins: Spin[], limit = 4): Album[] {
  if (spins.length > 0) {
    const byId = new Map(albums.map((album) => [album.id, album]));
    const out: Album[] = [];
    const seen = new Set<string>();
    for (const spin of spins) {
      if (!spin.albumId || seen.has(spin.albumId)) continue;
      const album = byId.get(spin.albumId);
      if (!album) continue;
      seen.add(spin.albumId);
      out.push(album);
      if (out.length >= limit) break;
    }
    return out;
  }

  // A friend's shelf reads albums alone, so it falls back to the mirror column.
  return albums
    .filter((album) => album.lastListenedAt)
    .sort((a, b) => time(b.lastListenedAt) - time(a.lastListenedAt))
    .slice(0, limit);
}

/** The releases they rate highest — Sonar's stand-in for Radar's pinned top 4. */
export function topRated(albums: Album[], ratings: AlbumRating[], limit = 4): Album[] {
  const scoreByKey = new Map<string, number>();
  for (const rating of ratings) {
    const score = personalScore(rating.ratings);
    if (score != null && score > 0) scoreByKey.set(rating.albumKey, score);
  }

  return albums
    .map((album) => ({ album, score: scoreByKey.get(album.albumKey) ?? 0 }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.album.title.localeCompare(b.album.title))
    .slice(0, limit)
    .map((entry) => entry.album);
}
