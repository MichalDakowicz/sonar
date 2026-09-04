import { albumKey, artistList } from '@/lib/albumKey';
import { normalizeStatus } from '@/lib/albumStatus';
import { normalizeFormats } from '@/lib/formats';
import type { Album, AlbumRating, Ratings, Spin } from '@/types/album';

// Raw shape of a row from public.albums (supabase/schema.sql).
export type AlbumRow = {
  id: string;
  user_id: string;
  spotify_id: string | null;
  album_key: string | null;
  title: string;
  artist: unknown;
  cover_url: string | null;
  release_date: string | null;
  release_date_precision: string | null;
  total_tracks: number | null;
  genres: unknown;
  url: string | null;
  formats: unknown;
  status: string | null;
  notes: string | null;
  favorite_tracks: string | null;
  acquisition_date: string | null;
  store_name: string | null;
  price_paid: number | string | null;
  catalog_number: string | null;
  custom_order: number | null;
  last_listened_at: string | null;
  added_at: string;
  updated_at: string;
};

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => String(entry).trim()).filter(Boolean);
}

/** numeric columns come back as strings from PostgREST when they are wide. */
function numberOrNull(raw: number | string | null): number | null {
  if (raw == null || raw === '') return null;
  const value = typeof raw === 'number' ? raw : parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * The single read boundary: every screen consumes `Album`, never a raw row.
 * Coerces the legacy shapes the Firebase app wrote (single-string artist,
 * single-string format, absent status) so a row can never render in an
 * inconsistent state, and back-fills album_key for rows written before it
 * existed — the rating join depends on it never being null in app-land.
 */
export function normalizeAlbum(row: AlbumRow): Album {
  const artist = artistList(row.artist as string[] | string | null);
  return {
    id: row.id,
    userId: row.user_id,
    spotifyId: row.spotify_id,
    albumKey: row.album_key || albumKey({ spotifyId: row.spotify_id, title: row.title, artist }),
    title: row.title,
    artist,
    coverUrl: row.cover_url,
    releaseDate: row.release_date,
    releaseDatePrecision: row.release_date_precision,
    totalTracks: row.total_tracks,
    genres: stringList(row.genres),
    url: row.url ?? '',
    formats: normalizeFormats(row.formats),
    status: normalizeStatus(row.status),
    notes: row.notes ?? '',
    favoriteTracks: row.favorite_tracks ?? '',
    acquisitionDate: row.acquisition_date,
    storeName: row.store_name ?? '',
    pricePaid: numberOrNull(row.price_paid),
    catalogNumber: row.catalog_number ?? '',
    customOrder: row.custom_order,
    lastListenedAt: row.last_listened_at,
    addedAt: row.added_at,
    updatedAt: row.updated_at,
  };
}

// Partial camelCase Album -> snake_case columns, for writes. Only maps keys
// that are present, so callers can pass a sparse update (every write also runs
// through stripUndefined).
const FIELD_MAP: Record<string, string> = {
  spotifyId: 'spotify_id',
  albumKey: 'album_key',
  title: 'title',
  artist: 'artist',
  coverUrl: 'cover_url',
  releaseDate: 'release_date',
  releaseDatePrecision: 'release_date_precision',
  totalTracks: 'total_tracks',
  genres: 'genres',
  url: 'url',
  formats: 'formats',
  status: 'status',
  notes: 'notes',
  favoriteTracks: 'favorite_tracks',
  acquisitionDate: 'acquisition_date',
  storeName: 'store_name',
  pricePaid: 'price_paid',
  catalogNumber: 'catalog_number',
  customOrder: 'custom_order',
  lastListenedAt: 'last_listened_at',
  updatedAt: 'updated_at',
};

export function toAlbumRow(album: Partial<Album>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(album)) {
    const column = FIELD_MAP[key];
    if (!column) continue;
    // Postgres date/numeric columns reject '' where the form has an empty field.
    row[column] = value === '' && (column === 'acquisition_date' || column === 'price_paid') ? null : value;
  }
  return row;
}

export type SpinRow = {
  id: string;
  user_id: string;
  album_id: string | null;
  album_key: string | null;
  title: string;
  artist: unknown;
  cover_url: string | null;
  played_at: string;
};

export function normalizeSpin(row: SpinRow): Spin {
  return {
    id: row.id,
    userId: row.user_id,
    albumId: row.album_id,
    albumKey: row.album_key,
    title: row.title,
    artist: artistList(row.artist as string[] | string | null),
    coverUrl: row.cover_url,
    playedAt: row.played_at,
  };
}

export type AlbumRatingRow = {
  user_id: string;
  album_key: string;
  spotify_id: string | null;
  title: string;
  artist: unknown;
  cover_url: string | null;
  release_date: string | null;
  ratings: Ratings | null;
  review: string | null;
  created_at: string;
  updated_at: string;
};

export function normalizeRating(row: AlbumRatingRow): AlbumRating {
  return {
    userId: row.user_id,
    albumKey: row.album_key,
    spotifyId: row.spotify_id,
    title: row.title,
    artist: artistList(row.artist as string[] | string | null),
    coverUrl: row.cover_url,
    releaseDate: row.release_date,
    ratings: row.ratings ?? {},
    review: row.review ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
