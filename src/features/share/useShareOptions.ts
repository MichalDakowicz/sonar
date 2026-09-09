import { useQuery } from '@tanstack/react-query';

import type { ShareResolution, ShareTabKind } from '@/features/share/useShareResolution';
import { singlesForTrack } from '@/lib/releaseMatch';
import { isSpotifyConfigured, type SpotifyAlbum } from '@/lib/spotify';
import { fetchArtist, fetchArtistReleases, type ReleaseGroup } from '@/lib/spotifyLookup';
import { albumCandidate, artistCandidate, songCandidate, type RatingCandidate } from '@/lib/spotifySubjects';

/**
 * One thing a tab offers.
 *
 * `album` is what separates the two halves of the sheet: a release can be put
 * on a shelf, and a song or an artist can only be rated. Carrying the release
 * alongside the candidate means the Add path still gets the full Spotify album
 * it needs to write a row, without the candidate type having to grow a
 * shelf-shaped field that is null two thirds of the time.
 */
export type ShareOption = {
  candidate: RatingCandidate;
  album: SpotifyAlbum | null;
};

const releaseOption = (album: SpotifyAlbum): ShareOption => ({ candidate: albumCandidate(album), album });

/**
 * The options one tab offers.
 *
 * Every tab answers with the same shape, so the sheet's list and its action
 * buttons are written once — whether the tab holds the song that was shared or
 * forty singles by its artist.
 *
 * The two release tabs share a query key with each other by group, so opening
 * Singles after the song tab has already looked them up costs nothing.
 */
export function useShareOptions(resolution: ShareResolution, kind: ShareTabKind | null) {
  const subject = resolution.subject;
  const artistId = subject?.artistId ?? null;
  const track = subject?.track ?? null;
  const parent = subject?.parent ?? null;

  const group: ReleaseGroup | null =
    kind === 'artistAlbums' ? 'album' : kind === 'artistSingles' ? 'single' : null;

  const releases = useQuery({
    queryKey: ['artistReleases', artistId, group],
    queryFn: () => fetchArtistReleases(artistId!, group!),
    enabled: !!artistId && !!group && isSpotifyConfigured(),
    staleTime: 60 * 60 * 1000,
  });

  // Only fetched when the artist tab is opened on a share that did not name an
  // artist directly — a shared song knows the id but not the picture.
  const needsArtist = kind === 'artist' && !subject?.artist && !!artistId;
  const artist = useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => fetchArtist(artistId!),
    enabled: needsArtist && isSpotifyConfigured(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const options = pick();
  const loading = (!!group && releases.isFetching) || (needsArtist && artist.isFetching);

  function pick(): ShareOption[] {
    if (kind === 'song') return track ? [{ candidate: songCandidate(track), album: null }] : [];

    if (kind === 'album') return parent ? [releaseOption(parent)] : [];

    if (kind === 'artist') {
      const resolved = subject?.artist ?? artist.data ?? null;
      return resolved ? [{ candidate: artistCandidate(resolved), album: null }] : [];
    }

    const list = releases.data ?? [];
    // On the singles tab, lead with the pressing of the song that was shared —
    // it is the one the user is most likely to be holding.
    const ordered =
      kind === 'artistSingles' && track ? withSinglesFirst(list, track.name) : list;
    return ordered.map(releaseOption);
  }

  return { options, loading, error: releases.error ?? artist.error };
}

function withSinglesFirst(releases: SpotifyAlbum[], trackName: string): SpotifyAlbum[] {
  const matches = singlesForTrack(releases, trackName);
  if (matches.length === 0) return releases;
  const matched = new Set(matches.map((release) => release.spotifyId));
  return [...matches, ...releases.filter((release) => !matched.has(release.spotifyId))];
}
