import type { Album, Spin } from '@/types/album';

/**
 * Derivations over the spin log. The log is the source of truth — albums.
 * last_listened_at is only its mirror, kept so a friend's shelf can read
 * albums alone without pulling that person's whole history.
 */

export type SpinSummary = {
  /** Newest listen per album id. */
  lastPlayedById: Map<string, string>;
  /** How many times each album has been played. */
  countById: Map<string, number>;
  totalSpins: number;
};

/** Assumes `spins` is newest-first, which is how every query orders it. */
export function summarizeSpins(spins: Spin[]): SpinSummary {
  const lastPlayedById = new Map<string, string>();
  const countById = new Map<string, number>();

  for (const spin of spins) {
    if (!spin.albumId) continue;
    if (!lastPlayedById.has(spin.albumId)) lastPlayedById.set(spin.albumId, spin.playedAt);
    countById.set(spin.albumId, (countById.get(spin.albumId) ?? 0) + 1);
  }

  return { lastPlayedById, countById, totalSpins: spins.length };
}

/** The albums played most, richest first. Used by Stats' "most spun" list. */
export function topSpun(albums: Album[], summary: SpinSummary, limit = 5): { album: Album; count: number }[] {
  return albums
    .map((album) => ({ album, count: summary.countById.get(album.id) ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.album.title.localeCompare(b.album.title))
    .slice(0, limit);
}

/**
 * The newest spin per album, as a list of albums — "recently played" on the
 * collection screen. Albums whose rows are gone are skipped: the row is what
 * the section links to.
 */
export function recentlyPlayed(albums: Album[], spins: Spin[], limit = 20): Album[] {
  const byId = new Map(albums.map((album) => [album.id, album]));
  const seen = new Set<string>();
  const out: Album[] = [];

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

/** Spins inside a window, for the period-scoped stats. */
export function spinsSince(spins: Spin[], from: number): Spin[] {
  return spins.filter((spin) => new Date(spin.playedAt).getTime() >= from);
}

/**
 * Listens per day for the last `days` days, oldest first — the little activity
 * strip on Stats. Local dates, because "what did I play yesterday" is a
 * question about the user's own day, not about UTC.
 */
export function spinsPerDay(spins: Spin[], days: number, now = Date.now()): { date: string; count: number }[] {
  const buckets = new Map<string, number>();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);
    buckets.set(localDateKey(day), 0);
  }

  for (const spin of spins) {
    const key = localDateKey(new Date(spin.playedAt));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets].map(([date, count]) => ({ date, count }));
}

export function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Consecutive days up to today with at least one listen. Yesterday still counts
 * as alive — a streak that dies at midnight before you have had a chance to put
 * a record on would be a nag, not a stat.
 */
export function listeningStreak(spins: Spin[], now = Date.now()): number {
  const days = new Set(spins.map((spin) => localDateKey(new Date(spin.playedAt))));
  if (days.size === 0) return 0;

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(localDateKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
