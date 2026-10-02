import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { albumsQueryKey, dropAlbum, refreshAlbum } from '@/hooks/albumsCache';
import { ratingsQueryKey } from '@/hooks/useAlbumRatings';
import { spinsQueryKey } from '@/hooks/useSpins';
import { supabase } from '@/lib/supabase';

/**
 * The one realtime channel for the collection, mounted from the root layout. It
 * used to live inside useAlbums, useSpins and useAlbumRatings, which meant a
 * channel per mounted screen - and every one refetched its whole table for each
 * event.
 *
 * An album event patches the row it names (Postgres only puts the primary key in a
 * DELETE's `old` record, which is all that is needed to drop it). The spin log and
 * the ratings are a few small columns a row, so they simply refetch.
 */
export function useLibraryRealtime() {
  const { user } = useAuth();
  const uid = user?.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!uid) return;
    const filter = `user_id=eq.${uid}`;
    // Random suffix per the dev-mode double mount note: supabase-js caches
    // channels by name and a re-subscribed one throws on `.on()`.
    const channel = supabase
      .channel(`library:${uid}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'albums', filter }, (payload) => {
        const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as { id?: string };
        if (!row?.id) {
          queryClient.invalidateQueries({ queryKey: albumsQueryKey(uid) });
        } else if (payload.eventType === 'DELETE') {
          dropAlbum(queryClient, uid, row.id);
        } else {
          void refreshAlbum(queryClient, uid, row.id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'album_spins', filter }, () =>
        queryClient.invalidateQueries({ queryKey: spinsQueryKey(uid) }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'album_ratings', filter }, () =>
        queryClient.invalidateQueries({ queryKey: ratingsQueryKey(uid) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, queryClient]);
}
