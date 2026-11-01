import { albumKey } from '@/lib/albumKey';
import { parseSpotifyRef } from '@/lib/spotifyLink';
import { supabase } from '@/lib/supabase';

/**
 * Spotify metadata through Ping's authenticated catalogue function.
 * App credentials and Spotify access tokens remain on the server.
 */

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
    super('Spotify search is temporarily unavailable — try again later.');
    this.name = 'SpotifyNotConfiguredError';
  }
}

export function isSpotifyConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
}

/**
 * The function accepts only validated catalogue paths and verifies our session.
 */
export async function spotifyGet<T>(path: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('spotify-catalogue', { body: { path } });
  if (error || data == null) throw new Error('Spotify search is unavailable — try again shortly');
  return data;
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

export async function searchAlbums(query: string, limit = 10): Promise<SpotifyAlbum[]> {
  if (!query.trim()) return [];
  const data = await spotifyGet<{ albums: { items: RawAlbum[] } }>(
    `/search?q=${encodeURIComponent(query)}&type=album&limit=${Math.max(1, Math.min(10, limit))}`,
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
