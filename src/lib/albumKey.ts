/**
 * The identity of a *release*, independent of whether anyone owns it.
 *
 * Ratings are keyed by this rather than by an album row id, which is what lets
 * you rate something you do not own — a friend's record, a search result, an
 * album you only ever streamed — and what makes a rating survive removing the
 * album from your collection and adding it back later.
 *
 * Two shapes, and the prefix says which:
 *   spotify:<id>              a release Spotify knows
 *   manual:<artist>|<title>   a hand-typed entry, keyed by what was typed
 *
 * Pure and dependency-free so the migration script and the tests can use it.
 */

/**
 * Lowercase, collapse whitespace, drop punctuation that varies per pressing.
 *
 * Exported because release *matching* needs the same normalisation the key uses:
 * lib/releaseMatch compares a song title against an artist's single pressings,
 * and it must agree with what would key them.
 */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    // Strip combining marks so "Beyoncé" and "Beyonce" key the same.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

export type AlbumIdentity = {
  spotifyId?: string | null;
  title: string;
  artist?: string[] | string | null;
};

export function artistList(artist: string[] | string | null | undefined): string[] {
  if (Array.isArray(artist)) return artist.map((a) => String(a).trim()).filter(Boolean);
  if (typeof artist === 'string') {
    // Legacy rows stored several artists in one string, semicolon-separated. A
    // bare comma is left alone: plenty of single acts have one in their name.
    const parts = artist.includes(';') ? artist.split(';') : [artist];
    return parts.map((a) => a.trim()).filter(Boolean);
  }
  return [];
}

/**
 * A manual key uses the *first* credited artist only. A reissue that adds a
 * featured name would otherwise read as a different record than the one you
 * already rated.
 */
export function albumKey(identity: AlbumIdentity): string {
  if (identity.spotifyId) return `spotify:${identity.spotifyId}`;
  const artists = artistList(identity.artist);
  return `manual:${slug(artists[0] ?? 'unknown')}|${slug(identity.title)}`;
}

export function isSpotifyKey(key: string): boolean {
  return key.startsWith('spotify:');
}

/** The Spotify id inside a key, or null for a manual one. */
export function spotifyIdFromKey(key: string): string | null {
  return isSpotifyKey(key) ? key.slice('spotify:'.length) : null;
}
