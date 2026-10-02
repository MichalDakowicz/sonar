import type { QueryClient } from '@tanstack/react-query';

import { removeAlbumById, upsertAlbum } from '@/lib/albumList';
import { normalizeAlbum, type AlbumRow } from '@/lib/normalizeAlbum';
import { supabase } from '@/lib/supabase';
import type { Album } from '@/types/album';

// The collection is the heaviest read in the app, so a change to one album
// patches that one row into the cache. Refetching the list on every write - or
// on every realtime echo - re-downloaded the whole shelf each time.

export function albumsQueryKey(userId: string | undefined) {
  return ['albums', userId] as const;
}

/** A row the caller already holds (an insert returns it), slotted into the cache. */
export function patchAlbum(queryClient: QueryClient, userId: string, album: Album) {
  queryClient.setQueryData<Album[]>(albumsQueryKey(userId), (list) => (list ? upsertAlbum(list, album) : list));
}

export function dropAlbum(queryClient: QueryClient, userId: string, id: string) {
  queryClient.setQueryData<Album[]>(albumsQueryKey(userId), (list) => (list ? removeAlbumById(list, id) : list));
}

/** One album, fetched on its own. */
async function fetchAlbumRow(id: string): Promise<Album | null> {
  const { data, error } = await supabase.from('albums').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? normalizeAlbum(data as AlbumRow) : null;
}

const running = new Map<string, Promise<void>>();
const stale = new Set<string>();

/**
 * Re-reads one album into the cached list. Never rejects: if the single read
 * fails the whole list is invalidated instead, which is the old (costly) path
 * but still correct.
 *
 * A call that lands while the same album is already being read marks it stale
 * and reads once more afterwards - the in-flight read may predate that write.
 */
export function refreshAlbum(queryClient: QueryClient, userId: string, id: string): Promise<void> {
  const key = `${userId}:${id}`;
  const active = running.get(key);
  if (active) {
    stale.add(key);
    return active;
  }

  const task = fetchAlbumRow(id)
    .then((album) => {
      if (!album) return dropAlbum(queryClient, userId, id);
      patchAlbum(queryClient, userId, album);
    })
    .catch(() => {
      queryClient.invalidateQueries({ queryKey: albumsQueryKey(userId) });
    })
    .finally(() => {
      running.delete(key);
      if (stale.delete(key)) void refreshAlbum(queryClient, userId, id);
    });
  running.set(key, task);
  return task;
}
