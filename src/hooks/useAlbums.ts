import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthProvider';
import { albumsQueryKey, dropAlbum, patchAlbum, refreshAlbum } from '@/hooks/albumsCache';
import { albumKey } from '@/lib/albumKey';
import { normalizeAlbum, toAlbumRow, type AlbumRow } from '@/lib/normalizeAlbum';
import { stripUndefined } from '@/lib/stripUndefined';
import { supabase } from '@/lib/supabase';
import type { Album, AlbumActivityType } from '@/types/album';

// Realtime (useLibraryRealtime) and our own writes both patch single rows into this
// list, so a full re-read is only the catch-up after the app was away - the socket
// is not delivering while it is backgrounded.
const LIBRARY_STALE_MS = 5 * 60 * 1000;

async function fetchAlbums(userId: string): Promise<Album[]> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });
  if (error) throw error;
  return (data as AlbumRow[]).map(normalizeAlbum);
}

/**
 * The activity log is written here, beside the mutation, for the same reason
 * Radar's is: an event that has to be logged by the caller is an event that
 * eventually is not.
 */
async function logActivity(
  userId: string,
  album: { id: string | null; albumKey: string | null; title: string },
  type: AlbumActivityType,
  details: Record<string, unknown> = {},
) {
  const { error } = await supabase.from('album_activity').insert(
    stripUndefined({
      user_id: userId,
      album_id: album.id,
      album_key: album.albumKey,
      album_title: album.title,
      type,
      details,
    }),
  );
  // A feed row failing must never fail the write the user asked for.
  if (error) console.error('Failed to log album activity', error);
}

export type NewAlbum = Partial<Album> & { title: string };

/**
 * The collection, plus its write helpers. A write patches the one row it touched
 * into the cached list (hooks/albumsCache) rather than refetching the shelf.
 */
export function useAlbums() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = albumsQueryKey(user?.id);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchAlbums(user!.id),
    enabled: !!user,
    staleTime: LIBRARY_STALE_MS,
  });

  const addAlbum = async (album: NewAlbum): Promise<Album | null> => {
    if (!user) return null;

    const key =
      album.albumKey ?? albumKey({ spotifyId: album.spotifyId ?? null, title: album.title, artist: album.artist });
    const row = stripUndefined({
      ...toAlbumRow({ ...album, albumKey: key }),
      user_id: user.id,
      title: album.title,
    });

    const { data, error } = await supabase.from('albums').insert(row).select('*').single();
    if (error) throw error;
    const inserted = normalizeAlbum(data as AlbumRow);

    await logActivity(user.id, { id: inserted.id, albumKey: key, title: inserted.title }, 'added', {
      status: inserted.status,
      format: inserted.formats[0],
      formats: inserted.formats,
    });
    patchAlbum(queryClient, user.id, inserted);
    return inserted;
  };

  const updateAlbum = async (albumId: string, updates: Partial<Album>, options: { silent?: boolean } = {}) => {
    if (!user) return;

    const current = query.data?.find((album) => album.id === albumId);
    const row = stripUndefined(toAlbumRow({ ...updates, updatedAt: new Date().toISOString() }));

    const { error } = await supabase.from('albums').update(row).eq('id', albumId);
    if (error) throw error;

    // `silent` is for writes the user did not ask for as an event — a drag to
    // reorder, the last-played mirror — which would otherwise fill the feed.
    if (current && !options.silent) {
      const target = { id: albumId, albumKey: current.albumKey, title: current.title };
      if (updates.status && updates.status !== current.status) {
        await logActivity(user.id, target, 'status_changed', {
          oldStatus: current.status,
          newStatus: updates.status,
        });
      } else if (updates.formats) {
        const gained = updates.formats.filter((format) => !current.formats.includes(format));
        if (gained.length > 0) await logActivity(user.id, target, 'format_added', { format: gained[0], formats: gained });
        else await logActivity(user.id, target, 'updated', {});
      } else if (Object.keys(updates).length > 0) {
        await logActivity(user.id, target, 'updated', {});
      }
    }

    void refreshAlbum(queryClient, user.id, albumId);
  };

  const removeAlbum = async (albumId: string) => {
    if (!user) return;

    const album = query.data?.find((entry) => entry.id === albumId);
    const { error } = await supabase.from('albums').delete().eq('id', albumId);
    if (error) throw error;

    if (album) {
      // The album row is gone, so album_id must be null or the activity FK
      // rejects the insert. The rating row is deliberately left alone: it keys
      // off the release, not the shelf, so a re-add finds its score again.
      await logActivity(user.id, { id: null, albumKey: album.albumKey, title: album.title }, 'removed', {});
    }
    dropAlbum(queryClient, user.id, albumId);
  };

  return {
    albums: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    addAlbum,
    updateAlbum,
    removeAlbum,
    refetch: query.refetch,
  };
}
