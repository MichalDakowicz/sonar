import { useMemo } from 'react';

import { useSpotifyAlbum } from '@/features/albums/add/useSpotifySearch';
import { DEFAULT_DRAFT, useQuickAdd, type QuickAddDraft } from '@/features/albums/add/useQuickAdd';
import { useAlbums } from '@/hooks/useAlbums';
import { useAlbumRatings } from '@/hooks/useAlbumRatings';
import { useSpins } from '@/hooks/useSpins';
import { spotifyIdFromKey } from '@/lib/albumKey';
import type { Album, Ratings, Spin } from '@/types/album';

export type AlbumDisplay = {
  albumKey: string;
  spotifyId: string | null;
  title: string;
  artist: string[];
  coverUrl: string | null;
  releaseDate: string | null;
  releaseDatePrecision: string | null;
  totalTracks: number | null;
  genres: string[];
  url: string;
};

export type AlbumDetail = {
  /** The row on your shelf, or null when you do not own this release. */
  album: Album | null;
  /** What to draw, whether it is owned or came back from Spotify. */
  display: AlbumDisplay | null;
  ratings: Ratings | null;
  spins: Spin[];
  loading: boolean;
  /** True while the release is known only by a key we cannot resolve. */
  unresolved: boolean;
  addToShelf: (draft?: QuickAddDraft) => Promise<Album | null>;
  removeFromShelf: () => Promise<void>;
  logSpin: () => Promise<void>;
  removeSpin: (spinId: string) => Promise<void>;
  pending: boolean;
};

/**
 * Resolves one release from either entry point, and is why there is a single
 * detail screen instead of two.
 *
 * - `/album/[albumId]` passes an id: a record on your shelf.
 * - `/release/[albumKey]` passes a release key: something from search, from
 *   Discover, or from a friend's shelf, which you may or may not own.
 *
 * Either way the screen gets the same shape, so rating, tracks and the hero are
 * written once — and rating works in both, because a rating hangs off the key
 * rather than off ownership.
 */
export function useAlbumDetail({ albumId, albumKey }: { albumId?: string; albumKey?: string }): AlbumDetail {
  const { albums, loading: albumsLoading } = useAlbums();
  const { ratingFor } = useAlbumRatings();
  const { spins, logSpin, removeSpin } = useSpins();
  const { add, remove, pendingKey } = useQuickAdd();

  const album = useMemo(() => {
    if (albumId) return albums.find((entry) => entry.id === albumId) ?? null;
    if (albumKey) return albums.find((entry) => entry.albumKey === albumKey) ?? null;
    return null;
  }, [albums, albumId, albumKey]);

  const key = album?.albumKey ?? albumKey ?? null;
  const spotifyId = album?.spotifyId ?? (key ? spotifyIdFromKey(key) : null);

  // Only fetched when the release is not on the shelf: an owned row already
  // carries everything the hero needs, and a network round trip on every open
  // of your own album would be a spinner for nothing.
  const { album: release, loading: releaseLoading } = useSpotifyAlbum(album ? null : spotifyId);

  const display = useMemo<AlbumDisplay | null>(() => {
    if (album) {
      return {
        albumKey: album.albumKey,
        spotifyId: album.spotifyId,
        title: album.title,
        artist: album.artist,
        coverUrl: album.coverUrl,
        releaseDate: album.releaseDate,
        releaseDatePrecision: album.releaseDatePrecision,
        totalTracks: album.totalTracks,
        genres: album.genres,
        url: album.url,
      };
    }
    if (release) {
      return {
        albumKey: release.albumKey,
        spotifyId: release.spotifyId,
        title: release.title,
        artist: release.artist,
        coverUrl: release.coverUrl,
        releaseDate: release.releaseDate,
        releaseDatePrecision: release.releaseDatePrecision,
        totalTracks: release.totalTracks,
        genres: release.genres,
        url: release.url,
      };
    }
    return null;
  }, [album, release]);

  const albumSpins = useMemo(
    () => (album ? spins.filter((spin) => spin.albumId === album.id) : []),
    [spins, album],
  );

  return {
    album,
    display,
    ratings: ratingFor(key)?.ratings ?? null,
    spins: albumSpins,
    loading: albumsLoading || releaseLoading,
    // A manual key with no Spotify id and no row behind it cannot be drawn —
    // the screen says so instead of rendering an empty hero.
    unresolved: !albumsLoading && !releaseLoading && !album && !release,
    addToShelf: async (draft: QuickAddDraft = DEFAULT_DRAFT) => (release ? add(release, draft) : null),
    removeFromShelf: async () => {
      if (key) await remove(key);
    },
    logSpin: async () => {
      if (album) await logSpin(album);
    },
    removeSpin,
    pending: !!key && pendingKey === key,
  };
}
