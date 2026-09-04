import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { supabase } from '@/lib/supabase';
import { isFeedWorthy } from '@/lib/socialFeed';
import type { AlbumActivityEvent, AlbumActivityType } from '@/types/album';

type ActivityRow = {
  id: string;
  user_id: string;
  album_id: string | null;
  album_key: string | null;
  album_title: string;
  type: AlbumActivityType;
  details: Record<string, unknown> | null;
  created_at: string;
};

function normalizeActivity(row: ActivityRow): AlbumActivityEvent {
  return {
    id: row.id,
    userId: row.user_id,
    albumId: row.album_id,
    albumKey: row.album_key,
    albumTitle: row.album_title,
    type: row.type,
    details: row.details ?? {},
    createdAt: row.created_at,
  };
}

const PAGE = 120;

/**
 * The feed: activity from a set of people (your friends, and you).
 *
 * One `in` query rather than one per friend — RLS already filters out anyone
 * whose shelf you may not see, so an author you cannot read simply contributes
 * no rows instead of erroring.
 *
 * Realtime is subscribed without a filter: `postgres_changes` filters take one
 * column comparison, and there is no way to say "user_id in (…)". Every insert
 * on the table therefore wakes this query, and the refetch is what decides what
 * you are allowed to see.
 */
export function useFriendActivity(authorIds: string[], selfId: string | undefined) {
  const queryClient = useQueryClient();
  const ids = useMemo(() => [...new Set(authorIds.filter(Boolean))].sort(), [authorIds]);
  const queryKey = useMemo(() => ['albumActivity', ids.join(',')] as const, [ids]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('album_activity')
        .select('*')
        .in('user_id', ids)
        .order('created_at', { ascending: false })
        .limit(PAGE);
      if (error) throw error;
      return (data as ActivityRow[]).map(normalizeActivity);
    },
    enabled: ids.length > 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (ids.length === 0) return;
    const channel = supabase
      .channel(`album_activity:feed:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'album_activity' }, () =>
        queryClient.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ids, queryClient, queryKey]);

  const events = useMemo(() => (query.data ?? []).filter(isFeedWorthy), [query.data]);

  // Your own rows are fetched alongside your friends' — one query either way —
  // but the default view is about them, so the feed keeps yours out until you
  // tap yourself in the rail.
  const friendEvents = useMemo(() => events.filter((event) => event.userId !== selfId), [events, selfId]);

  return {
    events,
    friendEvents,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
