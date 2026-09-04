import { albumKey, artistList } from '@/lib/albumKey';
import { normalizeStatus } from '@/lib/albumStatus';
import { normalizeFormats } from '@/lib/formats';
import type { Album, AlbumRating, Ratings, Spin } from '@/types/album';

// Stable import/export format. The payload is versioned so future shape
// changes stay backwards-readable, and it carries all three of the things that
// are yours: the collection, the ratings (which can outlive an album row) and
// the spin log. Identity fields (`id`, `userId`) are dropped — they are
// re-minted per account on import.
//
// It also reads the legacy Firebase export the web app produced, so a backup
// taken from the old Sonar imports here without conversion.

export const EXPORT_VERSION = 2;

export type PortableAlbum = Omit<Partial<Album>, 'id' | 'userId'> & { title: string };
export type PortableRating = Omit<AlbumRating, 'userId' | 'createdAt' | 'updatedAt'>;
export type PortableSpin = Omit<Spin, 'id' | 'userId' | 'albumId'> & { albumKey: string | null };

export type ExportPayload = {
  version: number;
  exportedAt: string;
  counts: { albums: number; ratings: number; spins: number };
  albums: PortableAlbum[];
  ratings: PortableRating[];
  spins: PortableSpin[];
};

export function buildExportPayload(
  albums: Album[],
  ratings: AlbumRating[],
  spins: Spin[],
  exportedAt: string,
): ExportPayload {
  return {
    version: EXPORT_VERSION,
    exportedAt,
    counts: { albums: albums.length, ratings: ratings.length, spins: spins.length },
    albums: albums.map(({ id: _id, userId: _userId, ...rest }) => rest),
    ratings: ratings.map(({ userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...rest }) => rest),
    spins: spins.map(({ id: _id, userId: _userId, albumId: _albumId, ...rest }) => rest),
  };
}

export function serializeExport(albums: Album[], ratings: AlbumRating[], spins: Spin[], exportedAt: string): string {
  return JSON.stringify(buildExportPayload(albums, ratings, spins, exportedAt), null, 2);
}

export type ParseResult = {
  albums: PortableAlbum[];
  ratings: PortableRating[];
  spins: PortableSpin[];
  errors: string[];
};

function numberOrUndefined(raw: unknown): number | undefined {
  if (raw == null || raw === '') return undefined;
  const value = typeof raw === 'number' ? raw : parseFloat(String(raw));
  return Number.isFinite(value) ? value : undefined;
}

/** Firebase wrote epoch millis; Postgres wants ISO. Accepts either. */
function isoOrUndefined(raw: unknown): string | undefined {
  if (typeof raw === 'number') return new Date(raw).toISOString();
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
  }
  return undefined;
}

function coerceRatings(raw: unknown): Ratings | undefined {
  // The legacy app had a single `rating` number; the facets did not exist yet,
  // so it reads as the overall score and the breakdown stays empty.
  if (typeof raw === 'number' && raw > 0) return { overall: raw };
  if (!raw || typeof raw !== 'object') return undefined;
  const source = raw as Record<string, unknown>;
  const out: Ratings = {};
  for (const key of ['production', 'vocals', 'lyrics', 'replay', 'overall'] as const) {
    const value = numberOrUndefined(source[key]);
    if (value != null && value > 0) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function coerceAlbum(item: Record<string, unknown>, index: number, errors: string[]): PortableAlbum | null {
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (!title) {
    errors.push(`Album ${index + 1}: missing title, skipped`);
    return null;
  }

  const artist = artistList((item.artist as string[] | string | null) ?? null);
  const spotifyId = typeof item.spotifyId === 'string' ? item.spotifyId : null;

  return {
    title,
    artist,
    spotifyId,
    albumKey:
      typeof item.albumKey === 'string' && item.albumKey ? item.albumKey : albumKey({ spotifyId, title, artist }),
    coverUrl: typeof item.coverUrl === 'string' ? item.coverUrl : null,
    releaseDate: typeof item.releaseDate === 'string' ? item.releaseDate : null,
    releaseDatePrecision: typeof item.releaseDatePrecision === 'string' ? item.releaseDatePrecision : null,
    totalTracks: numberOrUndefined(item.totalTracks) ?? null,
    genres: Array.isArray(item.genres) ? item.genres.map(String) : [],
    // Legacy key was `format` (sometimes a bare string), current is `formats`.
    formats: normalizeFormats(item.formats ?? item.format),
    status: normalizeStatus(item.status),
    url: typeof item.url === 'string' ? item.url : '',
    notes: typeof item.notes === 'string' ? item.notes : '',
    favoriteTracks: typeof item.favoriteTracks === 'string' ? item.favoriteTracks : '',
    acquisitionDate: typeof item.acquisitionDate === 'string' && item.acquisitionDate ? item.acquisitionDate : null,
    storeName: typeof item.storeName === 'string' ? item.storeName : '',
    pricePaid: numberOrUndefined(item.pricePaid) ?? null,
    catalogNumber: typeof item.catalogNumber === 'string' ? item.catalogNumber : '',
    customOrder: numberOrUndefined(item.customOrder) ?? null,
    lastListenedAt: isoOrUndefined(item.lastListenedAt ?? item.lastListened) ?? null,
    addedAt: isoOrUndefined(item.addedAt) ?? new Date().toISOString(),
  };
}

/**
 * Accepts a Sonar export ({ version, albums, … }), a bare array of albums, or
 * the legacy Firebase user export ({ albums: {...}, history: {...} }) where
 * both collections are keyed objects rather than arrays.
 */
export function parseImport(text: string): ParseResult {
  const errors: string[] = [];
  const trimmed = text.trim();
  if (!trimmed) return { albums: [], ratings: [], spins: [], errors: ['Nothing to import — paste or pick a JSON file first.'] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { albums: [], ratings: [], spins: [], errors: ['Invalid JSON — expected a Sonar export file or an array of albums.'] };
  }

  const albumsRaw = collect(parsed, 'albums');
  const ratingsRaw = collect(parsed, 'ratings');
  // Legacy calls the log "history", the current format calls it "spins".
  const spinsRaw = [...(collect(parsed, 'history') ?? []), ...(collect(parsed, 'spins') ?? [])];

  if (!albumsRaw && !ratingsRaw && spinsRaw.length === 0) {
    return { albums: [], ratings: [], spins: [], errors: ['Unrecognised JSON shape — expected a Sonar export or an array of albums.'] };
  }

  const albums: PortableAlbum[] = [];
  (albumsRaw ?? []).forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      errors.push(`Album ${index + 1}: not an object, skipped`);
      return;
    }
    const coerced = coerceAlbum(raw as Record<string, unknown>, index, errors);
    if (coerced) albums.push(coerced);
  });

  // A legacy export carries its ratings on the album rows themselves, so those
  // become rating rows here — that is what makes an old backup keep its scores.
  const ratings: PortableRating[] = [];
  (albumsRaw ?? []).forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as Record<string, unknown>;
    const scores = coerceRatings(item.ratings ?? item.rating);
    if (!scores) return;
    const artist = artistList((item.artist as string[] | string | null) ?? null);
    const spotifyId = typeof item.spotifyId === 'string' ? item.spotifyId : null;
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    if (!title) return;
    ratings.push({
      albumKey: typeof item.albumKey === 'string' && item.albumKey ? item.albumKey : albumKey({ spotifyId, title, artist }),
      spotifyId,
      title,
      artist,
      coverUrl: typeof item.coverUrl === 'string' ? item.coverUrl : null,
      releaseDate: typeof item.releaseDate === 'string' ? item.releaseDate : null,
      ratings: scores,
      review: typeof item.review === 'string' ? item.review : '',
    });
  });

  (ratingsRaw ?? []).forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as Record<string, unknown>;
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const key = typeof item.albumKey === 'string' ? item.albumKey : '';
    const scores = coerceRatings(item.ratings);
    if (!title || !key || !scores) {
      errors.push(`Rating ${index + 1}: incomplete, skipped`);
      return;
    }
    // An explicit rating row wins over one reconstructed from an album row.
    const existing = ratings.findIndex((rating) => rating.albumKey === key);
    const row: PortableRating = {
      albumKey: key,
      spotifyId: typeof item.spotifyId === 'string' ? item.spotifyId : null,
      title,
      artist: artistList((item.artist as string[] | string | null) ?? null),
      coverUrl: typeof item.coverUrl === 'string' ? item.coverUrl : null,
      releaseDate: typeof item.releaseDate === 'string' ? item.releaseDate : null,
      ratings: scores,
      review: typeof item.review === 'string' ? item.review : '',
    };
    if (existing >= 0) ratings[existing] = row;
    else ratings.push(row);
  });

  const spins: PortableSpin[] = [];
  spinsRaw.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as Record<string, unknown>;
    const playedAt = isoOrUndefined(item.playedAt ?? item.timestamp);
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    if (!playedAt || !title) {
      errors.push(`Spin ${index + 1}: missing title or date, skipped`);
      return;
    }
    spins.push({
      albumKey: typeof item.albumKey === 'string' ? item.albumKey : null,
      title,
      artist: artistList((item.artist as string[] | string | null) ?? null),
      coverUrl: typeof item.coverUrl === 'string' ? item.coverUrl : null,
      playedAt,
    });
  });

  return { albums, ratings, spins, errors };
}

/** Arrays and Firebase's keyed objects both read as a list. */
function collect(parsed: unknown, key: string): Record<string, unknown>[] | null {
  if (Array.isArray(parsed)) return key === 'albums' ? (parsed as Record<string, unknown>[]) : null;
  if (!parsed || typeof parsed !== 'object') return null;
  const value = (parsed as Record<string, unknown>)[key];
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>) as Record<string, unknown>[];
  return null;
}

/**
 * A candidate is already on the shelf when it shares an album key — which is
 * the release identity, so a re-export of the same collection imports as zero
 * new rows rather than doubling it.
 */
export function isDuplicate(candidate: PortableAlbum, existing: Album[]): boolean {
  const key = candidate.albumKey;
  return existing.some((album) => (key ? album.albumKey === key : album.title.toLowerCase() === candidate.title.toLowerCase()));
}
