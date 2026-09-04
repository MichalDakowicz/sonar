import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { albumsQueryKey } from '@/hooks/useAlbums';
import { normalizeSpin, type SpinRow } from '@/lib/normalizeAlbum';
import { summarizeSpins } from '@/lib/spins';
import { stripUndefined } from '@/lib/stripUndefined';
import { supabase } from '@/lib/supabase';
import type { Album, Spin } from '@/types/album';

// The whole log, not a page of it: the collection sorts by last played and the
// stats count plays per album, so a truncated log would quietly under-report
// both. One row per listen is small — thousands of them are tens of kilobytes.
const SPIN_LIMIT = 5000;

function spinsQueryKey(userId: string | undefined) {
  return ['spins', userId] as const;
}

async function fetchSpins(userId: string): Promise<Spin[]> {
  const { data, error } = await supabase
    .from('album_spins')
    .select('*')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(SPIN_LIMIT);
  if (error) throw error;
  return (data as SpinRow[]).map(normalizeSpin);
}

/**
 * The spin log and its two writes. Logging a listen writes two rows: the spin
 * itself, and the mirror on the album (albums.last_listened_at) that a friend's
 * shelf reads without pulling anyone's history. Deleting one re-derives that
 * mirror from what is left, so removing today's play puts yesterday's back —
 * the behaviour the legacy app hand-rolled in useHistory.
 */
export function useSpins() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = spinsQueryKey(user?.id);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchSpins(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`album_spins:${user.id}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'album_spins', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, queryKey]);

  // Memoized rather than `query.data ?? []` inline: a fresh array literal every
  // render would re-run every consumer's derivation over the whole log.
  const spins = useMemo(() => query.data ?? [], [query.data]);
  const summary = useMemo(() => summarizeSpins(spins), [spins]);

  const logSpin = async (album: Album, playedAt: string = new Date().toISOString()) => {
    if (!user) return;

    const { error } = await supabase.from('album_spins').insert(
      stripUndefined({
        user_id: user.id,
        album_id: album.id,
        album_key: album.albumKey,
        title: album.title,
        artist: album.artist,
        cover_url: album.coverUrl,
        played_at: playedAt,
      }),
    );
    if (error) throw error;

    // Mirror + feed row. Only move the mirror forward: back-dating a listen you
    // forgot to log must not make an older play look like the latest one.
    if (!album.lastListenedAt || Date.parse(playedAt) > Date.parse(album.lastListenedAt)) {
      const { error: mirrorError } = await supabase
        .from('albums')
        .update({ last_listened_at: playedAt })
        .eq('id', album.id);
      if (mirrorError) console.error('Failed to update last played', mirrorError);
    }

    const { error: activityError } = await supabase.from('album_activity').insert({
      user_id: user.id,
      album_id: album.id,
      album_key: album.albumKey,
      album_title: album.title,
      type: 'logged_spin',
      details: { playedAt },
    });
    if (activityError) console.error('Failed to log spin activity', activityError);

    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: albumsQueryKey(user.id) });
  };

  const removeSpin = async (spinId: string) => {
    if (!user) return;

    const spin = spins.find((entry) => entry.id === spinId);
    const { error } = await supabase.from('album_spins').delete().eq('id', spinId);
    if (error) throw error;

    // Re-derive the mirror from the log rather than trusting the local cache:
    // this is the one write where being wrong leaves a visible lie on the card.
    if (spin?.albumId) {
      const { data, error: latestError } = await supabase
        .from('album_spins')
        .select('played_at')
        .eq('album_id', spin.albumId)
        .order('played_at', { ascending: false })
        .limit(1);
      if (latestError) console.error('Failed to re-read last played', latestError);
      const latest = (data as { played_at: string }[] | null)?.[0]?.played_at ?? null;
      const { error: mirrorError } = await supabase
        .from('albums')
        .update({ last_listened_at: latest })
        .eq('id', spin.albumId);
      if (mirrorError) console.error('Failed to update last played', mirrorError);
    }

    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: albumsQueryKey(user.id) });
  };

  return {
    spins,
    summary,
    loading: query.isLoading,
    error: query.error,
    logSpin,
    removeSpin,
  };
}

/** Read-only spin log for someone else's shelf (RLS decides if it is visible). */
export function usePublicSpins(userId: string | undefined, limit = 200) {
  const query = useQuery({
    queryKey: ['publicSpins', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('album_spins')
        .select('*')
        .eq('user_id', userId!)
        .order('played_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as SpinRow[]).map(normalizeSpin);
    },
    enabled: !!userId,
  });
  return { spins: query.data ?? [], loading: query.isLoading };
}
