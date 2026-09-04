import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useAlbums } from '@/hooks/useAlbums';
import { fetchAlbum, isSpotifyConfigured } from '@/lib/spotify';
import { goBackOrHome } from '@/lib/utils';
import type { Album, Format } from '@/types/album';

import { buildAlbumPayload, fromAlbum, hasIssues, isDirty, validate, type AlbumForm, type FormIssues } from './albumForm';

/**
 * All the state and the save/delete/refresh logic for the album editor. The
 * detail screen renders; this owns the form.
 */
export function useEditAlbumForm(album: Album | undefined) {
  const router = useRouter();
  const { updateAlbum, removeAlbum } = useAlbums();

  const [form, setForm] = useState<AlbumForm | null>(null);
  const [issues, setIssues] = useState<FormIssues>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initializedId = useRef<string | null>(null);

  // Initialize once per album id — a later cache refresh (realtime, the spin
  // mirror write) must not clobber edits in progress.
  useEffect(() => {
    if (album && initializedId.current !== album.id) {
      initializedId.current = album.id;
      setForm(fromAlbum(album));
      setIssues({});
    }
  }, [album]);

  const update = (patch: Partial<AlbumForm>) => setForm((current) => (current ? { ...current, ...patch } : current));

  const toggleFormat = (format: Format) =>
    setForm((current) =>
      current
        ? {
            ...current,
            formats: current.formats.includes(format)
              ? current.formats.filter((entry) => entry !== format)
              : [...current.formats, format],
          }
        : current,
    );

  const addArtist = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setForm((current) => (current ? { ...current, artist: [...current.artist, clean] } : current));
  };

  const removeArtist = (index: number) =>
    setForm((current) => (current ? { ...current, artist: current.artist.filter((_, i) => i !== index) } : current));

  /**
   * Re-pull the catalogue fields from Spotify. Only facts about the release are
   * overwritten — status, formats, notes, pressing details and the rating are
   * the user's and are never touched by a refresh.
   */
  const refreshMetadata = async () => {
    if (!album?.spotifyId || !isSpotifyConfigured()) return;
    setIsRefreshing(true);
    try {
      const release = await fetchAlbum(album.spotifyId);
      if (!release) return;
      update({
        title: release.title,
        artist: release.artist,
        coverUrl: release.coverUrl ?? '',
        releaseDate: release.releaseDate ?? '',
        url: release.url,
      });
      // genres and track count are catalogue-only, so they are written straight
      // through rather than staged in the form the user is editing.
      await updateAlbum(album.id, {
        genres: release.genres,
        totalTracks: release.totalTracks,
        releaseDatePrecision: release.releaseDatePrecision,
      }, { silent: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const save = async (options: { close?: boolean } = {}) => {
    if (!form || !album) return false;
    const found = validate(form);
    setIssues(found);
    if (hasIssues(found)) return false;

    setIsSaving(true);
    try {
      await updateAlbum(album.id, buildAlbumPayload(form));
      if (options.close) goBackOrHome(router);
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  // No navigation here: the detail screen decides where the user lands after a
  // removal (it keeps them on the release so it can be added straight back).
  const remove = async () => {
    if (!album) return;
    setIsSaving(true);
    try {
      await removeAlbum(album.id);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    issues,
    update,
    toggleFormat,
    addArtist,
    removeArtist,
    refreshMetadata,
    save,
    remove,
    isSaving,
    isRefreshing,
    dirty: !!form && !!album && isDirty(form, album),
  };
}
