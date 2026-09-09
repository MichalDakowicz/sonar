import { useQuery } from '@tanstack/react-query';

import { useAlbumRatings } from '@/hooks/useAlbumRatings';
import { subjectIdFromKey, subjectOf } from '@/lib/albumKey';
import { isSpotifyConfigured } from '@/lib/spotify';
import { fetchArtist, fetchTrack } from '@/lib/spotifyLookup';
import { artistCandidate, songCandidate, type RatingCandidate } from '@/lib/spotifySubjects';
import type { RatingSubject } from '@/types/album';

/**
 * Resolve a song or artist key into something drawable.
 *
 * Falls back to the stored rating row when Spotify cannot be reached: the row
 * carries a snapshot of the title, credit and artwork for exactly this reason,
 * so an already-rated song still opens with its name on it offline — and its
 * score can still be changed or removed, which is the point of being here.
 */
export function useSubjectDetail(subjectKey: string | undefined) {
  const { ratingFor } = useAlbumRatings();
  const key = subjectKey ?? '';
  const subject: RatingSubject = subjectOf(key);
  const spotifyId = key ? subjectIdFromKey(key) : null;
  const stored = ratingFor(key);

  const query = useQuery({
    queryKey: ['subjectDetail', key],
    queryFn: async (): Promise<RatingCandidate | null> => {
      if (subject === 'song') return songCandidate(await fetchTrack(spotifyId!));
      if (subject === 'artist') return artistCandidate(await fetchArtist(spotifyId!));
      return null;
    },
    enabled: !!spotifyId && subject !== 'album' && isSpotifyConfigured(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const fallback: RatingCandidate | null = stored
    ? {
        subject: stored.subject,
        key: stored.albumKey,
        spotifyId: stored.spotifyId ?? '',
        title: stored.title,
        artist: stored.artist,
        coverUrl: stored.coverUrl,
        releaseDate: stored.releaseDate,
        context: stored.subject === 'artist' ? 'Artist' : 'Song',
      }
    : null;

  const candidate = query.data ?? fallback;

  return {
    subject,
    candidate,
    rating: stored,
    loading: query.isLoading && !fallback,
    /** Nothing to draw: no rating on file and Spotify could not resolve the key. */
    unresolved: !query.isLoading && !candidate,
  };
}
