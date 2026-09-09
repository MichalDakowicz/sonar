/**
 * The identity of a *release*, independent of whether anyone owns it.
 *
 * Ratings are keyed by this rather than by an album row id, which is what lets
 * you rate something you do not own — a friend's record, a search result, an
 * album you only ever streamed — and what makes a rating survive removing the
 * album from your collection and adding it back later.
 *
 * Four shapes, and the prefix says which:
 *   spotify:<id>              a release Spotify knows
 *   spotify:song:<id>         one song, rateable on its own
 *   spotify:artist:<id>       an artist, rateable on their whole body of work
 *   manual:<artist>|<title>   a hand-typed entry, keyed by what was typed
 *
 * Songs and artists are rate-only: there is no shelf row behind either, which
 * is exactly what the FK-less ratings table already allowed for. A song is not
 * folded into its album because they are different opinions — a great single on
 * a weak record is a normal thing to think.
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

const SONG_PREFIX = 'spotify:song:';
const ARTIST_PREFIX = 'spotify:artist:';

/** One song, scored on its own rather than through the record it sits on. */
export function songKey(spotifyId: string): string {
  return `${SONG_PREFIX}${spotifyId}`;
}

/** An artist, scored on their body of work. */
export function artistKey(spotifyId: string): string {
  return `${ARTIST_PREFIX}${spotifyId}`;
}

/**
 * What kind of thing a key names. The literal union is `RatingSubject` in
 * types/album — spelled out here so this file stays dependency-free for the
 * migration script, which imports it by relative path.
 *
 * Anything without a subject prefix is a release, which keeps every key written
 * before songs and artists existed reading correctly.
 */
export function subjectOf(key: string): 'album' | 'song' | 'artist' {
  if (key.startsWith(SONG_PREFIX)) return 'song';
  if (key.startsWith(ARTIST_PREFIX)) return 'artist';
  return 'album';
}

/**
 * The Spotify id inside a *release* key, or null for a manual one — and null
 * for a song or artist key too, so a caller that means "which album is this"
 * cannot be handed a track id and go looking for it in /albums.
 */
export function spotifyIdFromKey(key: string): string | null {
  return isSpotifyKey(key) && subjectOf(key) === 'album' ? key.slice('spotify:'.length) : null;
}

/** The Spotify id inside a key of any subject. */
export function subjectIdFromKey(key: string): string | null {
  const subject = subjectOf(key);
  if (subject === 'song') return key.slice(SONG_PREFIX.length) || null;
  if (subject === 'artist') return key.slice(ARTIST_PREFIX.length) || null;
  return spotifyIdFromKey(key);
}
