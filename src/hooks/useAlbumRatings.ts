import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { normalizeRating, type AlbumRatingRow } from '@/lib/normalizeAlbum';
import { personalScore } from '@/lib/personalScore';
import { isEmptyRatings } from '@/lib/ratings';
import { stripUndefined } from '@/lib/stripUndefined';
import { supabase } from '@/lib/supabase';
import type { AlbumRating, Ratings } from '@/types/album';

function ratingsQueryKey(userId: string | undefined) {
  return ['albumRatings', userId] as const;
}

async function fetchRatings(userId: string): Promise<AlbumRating[]> {
  const { data, error } = await supabase
    .from('album_ratings')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as AlbumRatingRow[]).map(normalizeRating);
}

/** What a rating needs to stand on its own, with no album row behind it. */
export type RateTarget = {
  albumKey: string;
  spotifyId?: string | null;
  title: string;
  artist?: string[];
  coverUrl?: string | null;
  releaseDate?: string | null;
};

/**
 * Every rating this user has given, keyed by release.
 *
 * Ratings live apart from the collection on purpose: you can rate a record you
 * do not own — a friend's copy, a search result, something you only streamed —
 * and the score survives adding and removing the album from your shelf. That is
 * why the table is keyed (user_id, album_key) with no FK to public.albums.
 */
export function useAlbumRatings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ratingsQueryKey(user?.id);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchRatings(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`album_ratings:${user.id}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'album_ratings', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, queryKey]);

  // Memoized rather than `query.data ?? []` inline: a fresh array literal on
  // every render would re-key the lookup below (and every consumer's memo) even
  // when the query result has not changed.
  const ratings = useMemo(() => query.data ?? [], [query.data]);
  const byKey = useMemo(() => new Map(ratings.map((rating) => [rating.albumKey, rating])), [ratings]);

  const ratingFor = useCallback((albumKey: string | null | undefined) => (albumKey ? byKey.get(albumKey) ?? null : null), [byKey]);

  const scoreFor = useCallback(
    (albumKey: string | null | undefined) => personalScore(ratingFor(albumKey)?.ratings),
    [ratingFor],
  );

  /**
   * Upsert, or delete when the form has been emptied — a row of all-zero
   * facets would count as "rated" everywhere (the curve, the average, the
   * rating sort) while showing nothing.
   */
  const saveRating = async (target: RateTarget, next: Ratings, review = '') => {
    if (!user) return;

    if (isEmptyRatings(next) && !review.trim()) {
      await removeRating(target.albumKey);
      return;
    }

    const { error } = await supabase.from('album_ratings').upsert(
      stripUndefined({
        user_id: user.id,
        album_key: target.albumKey,
        spotify_id: target.spotifyId ?? null,
        title: target.title,
        artist: target.artist ?? [],
        cover_url: target.coverUrl ?? null,
        release_date: target.releaseDate ?? null,
        ratings: next,
        review: review.trim(),
        updated_at: new Date().toISOString(),
      }),
      { onConflict: 'user_id,album_key' },
    );
    if (error) throw error;

    const score = personalScore(next);
    if (score != null && score > 0) {
      // The feed says "rated it 4.5", so it needs the score the user will see —
      // the overall if they set one, the facet average otherwise.
      const { error: activityError } = await supabase.from('album_activity').insert({
        user_id: user.id,
        album_key: target.albumKey,
        album_title: target.title,
        type: 'rating_changed',
        details: { rating: score },
      });
      if (activityError) console.error('Failed to log rating activity', activityError);
    }

    queryClient.invalidateQueries({ queryKey });
  };

  const removeRating = async (albumKey: string) => {
    if (!user) return;
    const { error } = await supabase.from('album_ratings').delete().eq('user_id', user.id).eq('album_key', albumKey);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    ratings,
    loading: query.isLoading,
    error: query.error,
    ratingFor,
    scoreFor,
    saveRating,
    removeRating,
  };
}

/** Read-only ratings for someone else's shelf (RLS decides if they are visible). */
export function usePublicRatings(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['publicRatings', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('album_ratings').select('*').eq('user_id', userId!);
      if (error) throw error;
      return (data as AlbumRatingRow[]).map(normalizeRating);
    },
    enabled: !!userId,
  });

  const ratings = useMemo(() => query.data ?? [], [query.data]);
  const byKey = useMemo(() => new Map(ratings.map((rating) => [rating.albumKey, rating])), [ratings]);

  return {
    ratings,
    loading: query.isLoading,
    ratingFor: (albumKey: string | null | undefined) => (albumKey ? byKey.get(albumKey) ?? null : null),
  };
}
