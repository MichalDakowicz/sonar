import type { Album } from '@/types/album';

// The collection is cached newest-added first, the order fetchAlbums asks for.
// These patch one row into that cache so a single change never costs a refetch
// of the whole collection.

/** Replaces the row in place, or slots a new one in where `added_at` puts it. */
export function upsertAlbum(list: Album[], album: Album): Album[] {
  const at = list.findIndex((a) => a.id === album.id);
  if (at >= 0) {
    const next = list.slice();
    next[at] = album;
    return next;
  }

  const slot = list.findIndex((a) => a.addedAt < album.addedAt);
  if (slot < 0) return [...list, album];
  return [...list.slice(0, slot), album, ...list.slice(slot)];
}

/** Returns the same array when the id is not in the list, so no subscriber re-renders. */
export function removeAlbumById(list: Album[], id: string): Album[] {
  return list.some((a) => a.id === id) ? list.filter((a) => a.id !== id) : list;
}
