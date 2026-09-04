import { useCallback, useMemo, useState } from 'react';

import { useAlbums, type NewAlbum } from '@/hooks/useAlbums';
import { albumKey } from '@/lib/albumKey';
import type { SpotifyAlbum } from '@/lib/spotify';
import type { Album, AlbumStatus, Format } from '@/types/album';

export type QuickAddDraft = {
  status: AlbumStatus;
  formats: Format[];
};

export const DEFAULT_DRAFT: QuickAddDraft = { status: 'Collection', formats: ['Digital'] };

/**
 * The shared "put this on my shelf" path: Discover's add buttons, the Quick-Add
 * sheet, and a release page's add button all go through this, so adding from
 * anywhere writes the same row.
 */
export function useQuickAdd() {
  const { albums, addAlbum, removeAlbum } = useAlbums();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const byKey = useMemo(() => new Map(albums.map((album) => [album.albumKey, album])), [albums]);

  const findByKey = useCallback((key: string | null | undefined) => (key ? byKey.get(key) ?? null : null), [byKey]);
  const isAdded = useCallback((key: string | null | undefined) => findByKey(key) !== null, [findByKey]);

  function toPayload(release: SpotifyAlbum, draft: QuickAddDraft): NewAlbum {
    return {
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
      formats: draft.formats,
      status: draft.status,
    };
  }

  /** Discover's one-tap add: always the draft defaults (Collection, Digital). */
  const add = async (release: SpotifyAlbum, draft: QuickAddDraft = DEFAULT_DRAFT): Promise<Album | null> => {
    if (isAdded(release.albumKey)) return null;
    setPendingKey(release.albumKey);
    try {
      return await addAlbum(toPayload(release, draft));
    } finally {
      setPendingKey(null);
    }
  };

  /** "Add manually" — Spotify has no match, so only what was typed is known. */
  const addManual = async (
    input: { title: string; artist: string[]; coverUrl?: string | null; releaseDate?: string | null; url?: string },
    draft: QuickAddDraft = DEFAULT_DRAFT,
  ): Promise<Album | null> => {
    const key = albumKey({ title: input.title, artist: input.artist });
    setPendingKey(key);
    try {
      return await addAlbum({
        albumKey: key,
        title: input.title,
        artist: input.artist,
        coverUrl: input.coverUrl ?? null,
        releaseDate: input.releaseDate ?? null,
        url: input.url ?? '',
        genres: [],
        formats: draft.formats,
        status: draft.status,
      });
    } finally {
      setPendingKey(null);
    }
  };

  const remove = async (key: string) => {
    const album = findByKey(key);
    if (!album) return;
    setPendingKey(key);
    try {
      await removeAlbum(album.id);
    } finally {
      setPendingKey(null);
    }
  };

  return { albums, add, addManual, remove, isAdded, findByKey, pendingKey };
}
