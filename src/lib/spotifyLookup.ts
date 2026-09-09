import { dedupeReleases } from '@/lib/releaseMatch';
import { spotifyGet, toAlbum, type RawAlbum, type SpotifyAlbum } from '@/lib/spotify';
import { isSpotifyShortLink } from '@/lib/spotifyLink';

/**
 * The Spotify endpoints a *share* needs, which album search never did: a track
 * (to find the release it sits on), an artist, and an artist's releases.
 *
 * Kept apart from lib/spotify so that file stays what it was — auth plus album
 * lookup — while sharing its token cache and its `toAlbum` read boundary.
 */

export type SpotifyTrackDetail = {
  id: string;
  name: string;
  durationMs: number;
  /** The release the shared link was pointing into. Never null on Spotify. */
  album: SpotifyAlbum;
  artistId: string | null;
  artistNames: string[];
};

export type SpotifyArtist = {
  id: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
};

/** Which of an artist's releases to list. Spotify's own `include_groups`. */
export type ReleaseGroup = 'album' | 'single';

export type RawTrack = {
  id: string;
  name: string;
  duration_ms: number;
  album: RawAlbum;
  artists: { id: string; name: string }[];
};

export type RawArtist = {
  id: string;
  name: string;
  images?: { url: string }[];
  genres?: string[];
};

/** Read boundary for a track. Exported: search returns these shapes too. */
export function toTrack(raw: RawTrack): SpotifyTrackDetail {
  return {
    id: raw.id,
    name: raw.name,
    durationMs: raw.duration_ms,
    album: toAlbum(raw.album),
    artistId: raw.artists?.[0]?.id ?? null,
    artistNames: (raw.artists ?? []).map((artist) => artist.name),
  };
}

/** Read boundary for an artist, for the same reason. */
export function toArtist(raw: RawArtist): SpotifyArtist {
  return {
    id: raw.id,
    name: raw.name,
    // images come widest-first, as they do on an album.
    imageUrl: raw.images?.[0]?.url ?? null,
    genres: raw.genres ?? [],
  };
}

export async function fetchTrack(id: string): Promise<SpotifyTrackDetail> {
  return toTrack(await spotifyGet<RawTrack>(`/tracks/${id}`));
}

export async function fetchArtist(id: string): Promise<SpotifyArtist> {
  return toArtist(await spotifyGet<RawArtist>(`/artists/${id}`));
}

/**
 * An artist's albums or singles, newest first and deduped.
 *
 * The endpoint returns one row per market when no market is pinned, which
 * client-credentials auth cannot do — see lib/releaseMatch for why the list is
 * collapsed by title and year rather than shown raw.
 */
export async function fetchArtistReleases(id: string, group: ReleaseGroup): Promise<SpotifyAlbum[]> {
  const data = await spotifyGet<{ items: RawAlbum[] }>(
    `/artists/${id}/albums?include_groups=${group}&limit=50`,
  );
  const releases = data.items.map(toAlbum);
  releases.sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
  return dedupeReleases(releases);
}

const CANONICAL_URL_RE = /https?:\/\/open\.spotify\.com\/[^\s"'<>\\]+/;

/**
 * Follow a `spotify.link` short link to the canonical URL it stands for.
 *
 * Two ways it can arrive: okhttp follows the redirect and `response.url` is
 * already the real link, or the host answers with an interstitial page that
 * only names the target in its markup. Both are read here so the share sheet
 * does not have to care which one it got.
 *
 * Android-only in practice — a browser cannot read a cross-origin redirect —
 * and the share intent this serves is Android-only too.
 */
export async function resolveSpotifyShortLink(url: string): Promise<string> {
  const response = await fetch(url, { redirect: 'follow' });
  if (response.url && !isSpotifyShortLink(response.url)) return response.url;

  const body = await response.text();
  return CANONICAL_URL_RE.exec(body)?.[0] ?? url;
}
