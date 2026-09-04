import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { ReactionKind } from '@/lib/socialFeed';

type ReactionRow = { activity_id: string; user_id: string; kind: ReactionKind };

export type ReactionState = {
  /** How many people used each emoji on this row. */
  counts: Record<ReactionKind, number>;
  /** Which of them you used — a second tap takes it back. */
  mine: Set<ReactionKind>;
};

const EMPTY: ReactionState = { counts: { fire: 0, eyes: 0, heart: 0 }, mine: new Set() };

/**
 * Reactions for a page of feed rows, in one query.
 *
 * Fetched for the visible ids rather than per card: a feed of forty rows would
 * otherwise open forty subscriptions and forty requests. Toggling is a plain
 * insert or delete — the table has no update policy, because a reaction has
 * nothing to change.
 */
export function useActivityReactions(activityIds: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const ids = useMemo(() => [...new Set(activityIds)].sort(), [activityIds]);
  const queryKey = useMemo(() => ['albumReactions', ids.join(',')] as const, [ids]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('album_activity_reactions').select('*').in('activity_id', ids);
      if (error) throw error;
      return data as ReactionRow[];
    },
    enabled: ids.length > 0,
    staleTime: 30_000,
  });

  const byActivity = useMemo(() => {
    const map = new Map<string, ReactionState>();
    for (const row of query.data ?? []) {
      const state =
        map.get(row.activity_id) ?? { counts: { fire: 0, eyes: 0, heart: 0 }, mine: new Set<ReactionKind>() };
      state.counts[row.kind] += 1;
      if (row.user_id === user?.id) state.mine.add(row.kind);
      map.set(row.activity_id, state);
    }
    return map;
  }, [query.data, user?.id]);

  const toggle = useMutation({
    mutationFn: async ({ activityId, kind }: { activityId: string; kind: ReactionKind }) => {
      if (!user) throw new Error('Not signed in');
      const mine = byActivity.get(activityId)?.mine.has(kind) ?? false;
      if (mine) {
        const { error } = await supabase
          .from('album_activity_reactions')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', user.id)
          .eq('kind', kind);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('album_activity_reactions')
          .insert({ activity_id: activityId, user_id: user.id, kind });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    reactionsFor: (activityId: string) => byActivity.get(activityId) ?? EMPTY,
    toggleReaction: (activityId: string, kind: ReactionKind) => toggle.mutateAsync({ activityId, kind }),
    toggling: toggle.isPending,
  };
}
