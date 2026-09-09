import { slug } from '@/lib/albumKey';

/**
 * Matching releases against each other, for the two places Spotify's catalogue
 * is messier than the app wants it.
 *
 * Pure and dependency-free, so both rules are testable without a network.
 */

type ReleaseLike = { title: string; releaseDate: string | null };

/**
 * Spotify's artist-albums endpoint repeats one release once per market when no
 * market is pinned, and client-credentials auth has no market to pin — so the
 * raw list shows "Abbey Road" eleven times. Collapse by title and year: two
 * pressings of the same record in the same year are the same record as far as a
 * pick-a-release list is concerned, and the first one Spotify returns wins.
 */
export function dedupeReleases<T extends ReleaseLike>(releases: T[]): T[] {
  const seen = new Set<string>();
  return releases.filter((release) => {
    const key = `${slug(release.title)}|${release.releaseDate?.slice(0, 4) ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * The single pressings of one song, out of an artist's singles.
 *
 * A single is normally titled exactly like its lead track, sometimes with a
 * suffix — "Ghost Town", "Ghost Town (Remix)", "Ghost Town - Single". Prefix
 * matches are kept because a 7" of the remix is still a 7" of that song, but
 * they sort behind the exact ones.
 */
export function singlesForTrack<T extends ReleaseLike>(singles: T[], trackName: string): T[] {
  const want = slug(trackName);
  if (!want) return [];

  const exact: T[] = [];
  const suffixed: T[] = [];
  for (const single of singles) {
    const title = slug(single.title);
    if (title === want) exact.push(single);
    else if (title.startsWith(`${want}-`)) suffixed.push(single);
  }
  return [...exact, ...suffixed];
}
