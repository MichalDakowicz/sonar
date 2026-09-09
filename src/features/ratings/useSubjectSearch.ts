import { useQuery } from '@tanstack/react-query';

import { useDebounced } from '@/features/albums/add/useSpotifySearch';
import { isSpotifyConfigured } from '@/lib/spotify';
import { extractUrl, isSpotifyShortLink, parseSpotifyRef } from '@/lib/spotifyLink';
import { resolveSpotifyShortLink } from '@/lib/spotifyLookup';
import { fetchSubject, searchSubjects, type RatingCandidate } from '@/lib/spotifySubjects';

/**
 * The Ratings page's search: albums, songs and artists at once.
 *
 * It used to search albums only, which made the "rate anything — album, artist
 * or a link" placeholder a promise the box could not keep. A pasted link still
 * short-circuits to that one thing, whatever kind it names, rather than being
 * searched as text.
 */
export function useSubjectSearch(term: string) {
  const query = useDebounced(term.trim());

  const result = useQuery({
    queryKey: ['subjectSearch', query],
    queryFn: async (): Promise<RatingCandidate[]> => {
      const ref = parseSpotifyRef(query) ?? (await resolvePastedShortLink(query));
      if (ref) {
        const candidate = await fetchSubject(ref);
        return candidate ? [candidate] : [];
      }
      return searchSubjects(query);
    },
    enabled: query.length > 1 && isSpotifyConfigured(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    results: result.data ?? [],
    loading: result.isFetching,
    error: result.error,
    unconfigured: !isSpotifyConfigured(),
  };
}

async function resolvePastedShortLink(query: string) {
  const url = extractUrl(query);
  if (!url || !isSpotifyShortLink(url)) return null;
  return parseSpotifyRef(await resolveSpotifyShortLink(url));
}
