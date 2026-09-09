/**
 * What a Spotify share actually contains.
 *
 * The Android share sheet does not hand over an id — it hands over a sentence
 * with a link buried in it ("Bohemian Rhapsody by Queen\nhttps://open.spotify…"),
 * sometimes localised (`/intl-pl/`), always with an `?si=` tracking param, and
 * often shortened to `spotify.link/xxxx` instead of the canonical host. So the
 * parser scans text rather than validating a URL, and short links get their own
 * flag because resolving one costs a network round trip (lib/spotifyLookup).
 *
 * Pure and dependency-free: the rules are testable without a renderer.
 */

export type SpotifyEntity = 'track' | 'album' | 'artist' | 'playlist';

/** One thing on Spotify, whatever shape the link that named it had. */
export type SpotifyRef = { type: SpotifyEntity; id: string };

const ENTITIES = 'track|album|artist|playlist';
// Deliberately loose in the path forms: every real id is 22 base62 characters,
// but a stricter pattern would reject a link some other app has re-encoded.
const PATH_ID = '[A-Za-z0-9]+';

const URI_RE = new RegExp(`spotify:(${ENTITIES}):(${PATH_ID})`, 'i');
const URL_RE = new RegExp(`spotify\\.com/(?:intl-[a-z-]+/)?(${ENTITIES})/(${PATH_ID})`, 'i');
const BARE_ID_RE = /^[A-Za-z0-9]{22}$/;
const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"']+/;

const SHORT_LINK_HOSTS = ['spotify.link', 'spotify.app.link'];

/**
 * The first Spotify entity named anywhere in `text`, or null.
 *
 * A bare id resolves to an album: that is what the legacy paste path accepted,
 * and it is the only entity a 22-character string on its own ever meant here.
 */
export function parseSpotifyRef(text: string | null | undefined): SpotifyRef | null {
  const value = (text ?? '').trim();
  if (!value) return null;

  const uri = URI_RE.exec(value);
  if (uri) return { type: uri[1].toLowerCase() as SpotifyEntity, id: uri[2] };

  const url = URL_RE.exec(value);
  if (url) return { type: url[1].toLowerCase() as SpotifyEntity, id: url[2] };

  if (BARE_ID_RE.test(value)) return { type: 'album', id: value };
  return null;
}

/** The first http(s) URL in shared text, so a short link can be followed. */
export function extractUrl(text: string | null | undefined): string | null {
  return URL_IN_TEXT_RE.exec(text ?? '')?.[0] ?? null;
}

/** True for the shortened links Spotify's own share sheet prefers. */
export function isSpotifyShortLink(url: string | null | undefined): boolean {
  const value = (url ?? '').toLowerCase();
  return SHORT_LINK_HOSTS.some((host) => value.includes(`${host}/`));
}
