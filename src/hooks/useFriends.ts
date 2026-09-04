import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { fetchProfiles } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/album';

export type FriendRequest = { profile: Profile; createdAt: string };

const friendsKey = (uid?: string) => ['friends', uid] as const;
const requestsKey = (uid?: string) => ['friendRequests', uid] as const;

async function fetchFriends(userId: string): Promise<Profile[]> {
  // friendships.friend_id references auth.users (not profiles), so PostgREST
  // can't embed the profile - fetch ids then hydrate profiles in one `in` query.
  const { data, error } = await supabase.from('friendships').select('friend_id').eq('user_id', userId);
  if (error) throw error;
  const ids = (data as { friend_id: string }[]).map((r) => r.friend_id);
  const profiles = await fetchProfiles(ids);
  return profiles.sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username));
}

async function fetchIncomingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('sender_id, created_at')
    .eq('recipient_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data as { sender_id: string; created_at: string }[];
  const profiles = await fetchProfiles(rows.map((r) => r.sender_id));
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return rows
    .map((r) => {
      const profile = byId.get(r.sender_id);
      return profile ? { profile, createdAt: r.created_at } : null;
    })
    .filter((r): r is FriendRequest => r !== null);
}

/**
 * Current user's friend list + incoming requests, with the friend-handshake
 * mutations. Replaces legacy useFriends (Firebase onValue + multi-path update)
 * with react-query + the security-definer RPCs (see schema.sql Phase 8): the
 * cross-side writes accept/decline/remove need aren't expressible under
 * owner-only RLS. Realtime on friend_requests + friendships keeps both live.
 */
export function useFriends() {
  const { user } = useAuth();
  const uid = user?.id;
  const queryClient = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: friendsKey(uid),
    queryFn: () => fetchFriends(uid!),
    enabled: !!uid,
  });

  const requestsQuery = useQuery({
    queryKey: requestsKey(uid),
    queryFn: () => fetchIncomingRequests(uid!),
    enabled: !!uid,
  });

  useEffect(() => {
    if (!uid) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: friendsKey(uid) });
      queryClient.invalidateQueries({ queryKey: requestsKey(uid) });
    };
    // Random suffix per the useMovies channel-reuse note (dev-mode double mount).
    const suffix = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`social:${uid}:${suffix}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `recipient_id=eq.${uid}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `user_id=eq.${uid}` }, invalidate)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, queryClient]);

  const sendRequest = useMutation({
    mutationFn: async (targetId: string) => {
      if (!uid) throw new Error('Not signed in');
      if (targetId === uid) throw new Error('You cannot add yourself');
      const { error } = await supabase.from('friend_requests').insert({ sender_id: uid, recipient_id: targetId, status: 'pending' });
      if (error) {
        // Composite PK (sender, recipient) already exists → request pending.
        if (error.code === '23505') throw new Error('Request already sent');
        throw error;
      }
    },
  });

  const acceptRequest = useMutation({
    mutationFn: async (senderId: string) => {
      const { error } = await supabase.rpc('accept_friend_request', { p_sender: senderId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendsKey(uid) });
      queryClient.invalidateQueries({ queryKey: requestsKey(uid) });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async (senderId: string) => {
      const { error } = await supabase.rpc('decline_friend_request', { p_sender: senderId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requestsKey(uid) }),
  });

  const removeFriend = useMutation({
    mutationFn: async (friendId: string) => {
      const { error } = await supabase.rpc('remove_friend', { p_friend: friendId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: friendsKey(uid) }),
  });

  return {
    friends: friendsQuery.data ?? [],
    requests: requestsQuery.data ?? [],
    loading: friendsQuery.isLoading || requestsQuery.isLoading,
    error: friendsQuery.error ?? requestsQuery.error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  };
}

/**
 * Just how many requests are waiting on you — no realtime channel, no
 * mutations. Always-mounted chrome (the nav bar's inbox badge and the dot on
 * the Social destination) wants the number, not a second subscription:
 * FriendRequestListener's `useFriends` already keeps this query key fresh
 * app-wide, and react-query dedupes the fetch.
 */
export function useIncomingRequestCount(): number {
  const { user } = useAuth();
  const uid = user?.id;
  const query = useQuery({
    queryKey: requestsKey(uid),
    queryFn: () => fetchIncomingRequests(uid!),
    enabled: !!uid,
  });
  return query.data?.length ?? 0;
}

// Read-only friend list for another user's public shelf. RLS (friendships_read
// → private.can_view) silently returns 0 rows when not permitted; the shelf
// screen uses can_view_user to tell "private" apart from "no friends".
export function usePublicFriends(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['publicFriends', userId],
    queryFn: () => fetchFriends(userId!),
    enabled: !!userId,
  });
  return { friends: query.data ?? [], loading: query.isLoading, error: query.error };
}
