import { albumKey } from '@/lib/albumKey';
import { parseSpotifyRef } from '@/lib/spotifyLink';

/**
 * Spotify metadata, client-credentials flow.
 *
 * The legacy web app had to proxy the token request through a Vite dev proxy
 * because browsers block the cross-origin POST to accounts.spotify.com. A
 * native app has no such restriction, so this talks to Spotify directly — which
 * is also why the id/secret live in EXPO_PUBLIC_* vars here: the token is
 * fetched on-device.
 *
 * client_credentials is app-level auth with no user context (no redirect URI,
 * no consent screen). It buys search and metadata, and nothing about anyone's
 * listening — which is all Sonar wants from Spotify.
 */

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';

export type SpotifyAlbum = {
  spotifyId: string;
  albumKey: string;
  title: string;
  artist: string[];
  /** Credited artists by id, so a release can pivot to who made it. */
  artistIds: string[];
  coverUrl: string | null;
  releaseDate: string | null;
  releaseDatePrecision: string | null;
  totalTracks: number | null;
  genres: string[];
  url: string;
  /** Spotify's own grouping. A single is a release you can own a 7" of. */
  albumType: 'album' | 'single' | 'compilation' | null;
};

export type SpotifyTrack = { number: number; title: string; durationMs: number };

export class SpotifyNotConfiguredError extends Error {
  constructor() {
    super('Spotify search is not configured — add EXPO_PUBLIC_SPOTIFY_CLIENT_ID and _SECRET to .env.');
    this.name = 'SpotifyNotConfiguredError';
  }
}

export function isSpotifyConfigured(): boolean {
  return !!CLIENT_ID && !!CLIENT_SECRET;
}

let accessToken: string | null = null;
let tokenExpiresAt = 0;
// One in-flight token request shared by every caller: the add sheet fires a
// search per keystroke (debounced) and would otherwise mint a token per call.
let tokenRequest: Promise<string> | null = null;

async function getAccessToken(): Promise<string> {
  if (!isSpotifyConfigured()) throw new SpotifyNotConfiguredError();
  // A minute of headroom, so a token cannot expire between here and the fetch.
  if (accessToken && Date.now() < tokenExpiresAt - 60_000) return accessToken;
  if (tokenRequest) return tokenRequest;

  tokenRequest = (async () => {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // btoa exists in Hermes and on web; RN has no Buffer.
        Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) throw new Error(`Spotify auth failed (${response.status})`);
    const data = (await response.json()) as { access_token: string; expires_in: number };
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return accessToken;
  })();

  try {
    return await tokenRequest;
  } finally {
    tokenRequest = null;
  }
}

/**
 * One authenticated GET. Exported so lib/spotifyLookup can reach the track and
 * artist endpoints without a second token cache.
 */
export async function spotifyGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401) {
    // Token rejected mid-life (revoked, or the clock drifted) — drop it and let
    // the next call mint a fresh one rather than failing every request after.
    accessToken = null;
    throw new Error('Spotify session expired — try again');
  }
  if (!response.ok) throw new Error(`Spotify request failed (${response.status})`);
  return (await response.json()) as T;
}

export type RawAlbum = {
  id: string;
  album_type?: string;
  name: string;
  artists: { id?: string; name: string }[];
  release_date: string | null;
  release_date_precision: string | null;
  images: { url: string }[];
  total_tracks: number | null;
  genres?: string[];
  external_urls: { spotify: string };
};

/** The read boundary for anything album-shaped Spotify returns. */
export function toAlbum(raw: RawAlbum): SpotifyAlbum {
  return {
    spotifyId: raw.id,
    albumKey: albumKey({ spotifyId: raw.id, title: raw.name, artist: raw.artists.map((a) => a.name) }),
    title: raw.name,
    artist: raw.artists.map((artist) => artist.name),
    artistIds: raw.artists.map((artist) => artist.id).filter((id): id is string => !!id),
    // images come widest-first; the first one is the 640px cover.
    coverUrl: raw.images?.[0]?.url ?? null,
    releaseDate: raw.release_date,
    releaseDatePrecision: raw.release_date_precision,
    totalTracks: raw.total_tracks,
    genres: raw.genres ?? [],
    url: raw.external_urls?.spotify ?? '',
    albumType: (raw.album_type as SpotifyAlbum['albumType']) ?? null,
  };
}

/**
 * An album id out of anything a user might paste. A link to a track or an
 * artist is not one — the share sheet handles those, because turning them into
 * something addable takes a choice (features/share).
 */
export function parseAlbumInput(input: string): string | null {
  const ref = parseSpotifyRef(input);
  return ref?.type === 'album' ? ref.id : null;
}

export async function searchAlbums(query: string, limit = 20): Promise<SpotifyAlbum[]> {
  if (!query.trim()) return [];
  const data = await spotifyGet<{ albums: { items: RawAlbum[] } }>(
    `/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`,
  );
  return data.albums.items.map(toAlbum);
}

/** Full metadata for one release — genres only ever come from this endpoint. */
export async function fetchAlbum(idOrUrl: string): Promise<SpotifyAlbum | null> {
  const id = parseAlbumInput(idOrUrl) ?? idOrUrl.trim();
  if (!id) return null;
  const raw = await spotifyGet<RawAlbum>(`/albums/${id}`);
  return toAlbum(raw);
}

export async function fetchAlbumTracks(id: string): Promise<SpotifyTrack[]> {
  const data = await spotifyGet<{ items: { track_number: number; name: string; duration_ms: number }[] }>(
    `/albums/${id}/tracks?limit=50`,
  );
  return data.items.map((item) => ({ number: item.track_number, title: item.name, durationMs: item.duration_ms }));
}
