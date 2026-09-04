import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

export type ActivityComment = {
  id: string;
  activityId: string;
  userId: string;
  body: string;
  createdAt: string;
};

type CommentRow = { id: string; activity_id: string; user_id: string; body: string; created_at: string };

function normalizeComment(row: CommentRow): ActivityComment {
  return { id: row.id, activityId: row.activity_id, userId: row.user_id, body: row.body, createdAt: row.created_at };
}

/**
 * One activity row's comments, oldest first — a thread reads forwards.
 *
 * Post or delete only: the table has no update policy, because editing a
 * comment after friends have read it is not a thing the UI offers. The 500
 * character cap is a CHECK constraint, so the input enforces the same limit
 * rather than letting the insert fail.
 */
export const COMMENT_MAX = 500;

export function useActivityComments(activityId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Memoized: a fresh tuple every render would re-subscribe the realtime
  // channel below on each pass.
  const queryKey = useMemo(() => ['albumComments', activityId] as const, [activityId]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('album_activity_comments')
        .select('*')
        .eq('activity_id', activityId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as CommentRow[]).map(normalizeComment);
    },
    enabled: !!activityId,
  });

  useEffect(() => {
    if (!activityId) return;
    const channel = supabase
      .channel(`album_comments:${activityId}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'album_activity_comments', filter: `activity_id=eq.${activityId}` },
        () => queryClient.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId, queryClient, queryKey]);

  const post = useMutation({
    mutationFn: async (body: string) => {
      if (!user || !activityId) throw new Error('Not signed in');
      const trimmed = body.trim().slice(0, COMMENT_MAX);
      if (!trimmed) throw new Error('Write something first');
      const { error } = await supabase
        .from('album_activity_comments')
        .insert({ activity_id: activityId, user_id: user.id, body: trimmed });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('album_activity_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    comments: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    postComment: (body: string) => post.mutateAsync(body),
    removeComment: (commentId: string) => remove.mutateAsync(commentId),
    posting: post.isPending,
  };
}

/** How many comments each of a page of rows has — the count on a feed card. */
export function useCommentCounts(activityIds: string[]) {
  const ids = [...new Set(activityIds)].sort();
  const query = useQuery({
    queryKey: ['albumCommentCounts', ids.join(',')],
    queryFn: async () => {
      // Ids only, counted client-side: PostgREST can group, but one small
      // select over a page of rows is simpler than an RPC for a badge.
      const { data, error } = await supabase.from('album_activity_comments').select('activity_id').in('activity_id', ids);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data as { activity_id: string }[]) {
        counts.set(row.activity_id, (counts.get(row.activity_id) ?? 0) + 1);
      }
      return counts;
    },
    enabled: ids.length > 0,
    staleTime: 30_000,
  });

  return (activityId: string) => query.data?.get(activityId) ?? 0;
}
