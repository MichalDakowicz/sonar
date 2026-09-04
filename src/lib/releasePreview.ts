import type { SpotifyAlbum } from '@/lib/spotify';
import type { Album } from '@/types/album';

/**
 * A Spotify hit, shaped as an `Album` so it can be drawn by the same card as
 * everything else.
 *
 * Discover would otherwise need its own result card, which is how the legacy
 * app ended up with three near-identical album tiles. The fields a shelf row
 * has and a search result cannot (formats, pressing details, spins) are left at
 * their empty values, and `status` is 'Collection' so the card does not dim a
 * release that is simply not yours yet.
 *
 * `id` is the release key, not a row id: nothing about a preview is persisted,
 * and using the key means a list of previews has stable, unique keys and taps
 * through to the same `/release/[albumKey]` screen the rest of the app uses.
 */
export function releaseToAlbum(release: SpotifyAlbum): Album {
  return {
    id: release.albumKey,
    userId: '',
    spotifyId: release.spotifyId,
    albumKey: release.albumKey,
    title: release.title,
    artist: release.artist,
    coverUrl: release.coverUrl,
    releaseDate: release.releaseDate,
    releaseDatePrecision: release.releaseDatePrecision,
    totalTracks: release.totalTracks,
    genres: release.genres,
    url: release.url,
    formats: [],
    status: 'Collection',
    notes: '',
    favoriteTracks: '',
    acquisitionDate: null,
    storeName: '',
    pricePaid: null,
    catalogNumber: '',
    customOrder: null,
    lastListenedAt: null,
    addedAt: '',
    updatedAt: '',
  };
}
