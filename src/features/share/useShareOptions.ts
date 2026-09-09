import { useQuery } from '@tanstack/react-query';

import type { ShareResolution, ShareTabKind } from '@/features/share/useShareResolution';
import { singlesForTrack } from '@/lib/releaseMatch';
import { isSpotifyConfigured, type SpotifyAlbum } from '@/lib/spotify';
import { fetchArtistReleases, type ReleaseGroup } from '@/lib/spotifyLookup';

/**
 * The releases one tab offers.
 *
 * Every tab answers with the same shape — a list of releases — so the sheet's
 * body and its Add/Rate buttons are written once, whether the tab holds the one
 * album that was shared or forty singles by its artist.
 *
 * The two singles tabs share a query key with each other on purpose: hunting a
 * song's 7" and listing an artist's singles hit the same endpoint, so opening
 * one warms the other.
 */
export function useShareOptions(resolution: ShareResolution, kind: ShareTabKind | null) {
  const subject = resolution.subject;
  const artistId = subject?.artistId ?? null;
  const trackName = subject?.trackName ?? null;
  const parent = subject?.parent ?? null;

  // A shared single is already the release; only a song has to go looking.
  const huntingSingle = kind === 'single' && parent?.albumType !== 'single';
  const group: ReleaseGroup | null =
    kind === 'artistAlbums' ? 'album' : kind === 'artistSingles' || huntingSingle ? 'single' : null;

  const query = useQuery({
    queryKey: ['artistReleases', artistId, group],
    queryFn: () => fetchArtistReleases(artistId!, group!),
    enabled: !!artistId && !!group && isSpotifyConfigured(),
    staleTime: 60 * 60 * 1000,
  });

  const releases = query.data ?? [];
  const options = pickOptions(kind, parent, trackName, releases);

  return {
    options,
    loading: !!group && query.isFetching,
    error: query.error,
  };
}

function pickOptions(
  kind: ShareTabKind | null,
  parent: SpotifyAlbum | null,
  trackName: string | null,
  releases: SpotifyAlbum[],
): SpotifyAlbum[] {
  if (!kind) return [];
  if (kind === 'album') return parent ? [parent] : [];
  if (kind === 'single') {
    if (parent?.albumType === 'single') return [parent];
    return trackName ? singlesForTrack(releases, trackName) : [];
  }
  return releases;
}
