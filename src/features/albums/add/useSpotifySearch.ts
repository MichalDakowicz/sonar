import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  fetchAlbum,
  fetchNewReleases,
  isSpotifyConfigured,
  parseAlbumInput,
  searchAlbums,
  type SpotifyAlbum,
} from '@/lib/spotify';

/** Debounce a fast-changing string, so a keystroke is not a network call. */
export function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Spotify search, cached per term. A pasted album link or id resolves straight
 * to that one release instead of being searched as text — which is how the
 * legacy app's "paste a Spotify URL" path worked, and it is still the fastest
 * way to add a record you are looking at in another app.
 */
export function useSpotifySearch(term: string) {
  const query = useDebounced(term.trim());

  const result = useQuery({
    queryKey: ['spotifySearch', query],
    queryFn: async (): Promise<SpotifyAlbum[]> => {
      const pastedId = parseAlbumInput(query);
      if (pastedId) {
        const album = await fetchAlbum(pastedId);
        return album ? [album] : [];
      }
      return searchAlbums(query);
    },
    enabled: query.length > 1 && isSpotifyConfigured(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    results: result.data ?? [],
    loading: result.isFetching,
    error: result.error,
    /** The search box is live but Spotify has no credentials — say so, once. */
    unconfigured: !isSpotifyConfigured(),
  };
}

/** Full metadata for one release — genres only come from the album endpoint. */
export function useSpotifyAlbum(spotifyId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['spotifyAlbum', spotifyId],
    queryFn: () => fetchAlbum(spotifyId!),
    enabled: !!spotifyId && isSpotifyConfigured(),
    staleTime: 24 * 60 * 60 * 1000,
  });
  return { album: query.data ?? null, loading: query.isLoading, error: query.error };
}

/** Discover's front page. Cached for an hour — new releases land weekly. */
export function useNewReleases() {
  const query = useQuery({
    queryKey: ['spotifyNewReleases'],
    queryFn: () => fetchNewReleases(),
    enabled: isSpotifyConfigured(),
    staleTime: 60 * 60 * 1000,
  });
  return {
    releases: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    unconfigured: !isSpotifyConfigured(),
    refetch: query.refetch,
  };
}
