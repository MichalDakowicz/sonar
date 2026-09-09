import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { isSpotifyConfigured, fetchAlbum, type SpotifyAlbum } from '@/lib/spotify';
import { extractUrl, isSpotifyShortLink, parseSpotifyRef, type SpotifyRef } from '@/lib/spotifyLink';
import { fetchArtist, fetchTrack, resolveSpotifyShortLink } from '@/lib/spotifyLookup';
import { artistsToDisplayString, releaseYear } from '@/lib/utils';

/**
 * What was shared, and everything it could reasonably mean.
 *
 * A share names one thing but Sonar shelves another: a song is not a row here,
 * an artist is not a row here, and the release you actually want may be the
 * album the song sits on or the 7" single of it. So a link resolves to a set of
 * *tabs*, each of which produces releases (useShareOptions), and the choice
 * stays the user's.
 */

export type ShareTabKind = 'album' | 'single' | 'artistAlbums' | 'artistSingles';
export type ShareTab = { kind: ShareTabKind; label: string };

export type ShareSubject = {
  headline: string;
  subline: string;
  coverUrl: string | null;
  /** The release the link pointed at, or pointed into for a song. */
  parent: SpotifyAlbum | null;
  /** Set only for a shared song, and only so its single can be hunted down. */
  trackName: string | null;
  artistId: string | null;
  artistName: string | null;
};

export type ShareResolution = {
  ref: SpotifyRef | null;
  subject: ShareSubject | null;
  tabs: ShareTab[];
  loading: boolean;
  error: unknown;
  /** Parseable, but a playlist — Sonar has no shelf shape for one. */
  unsupported: boolean;
  unconfigured: boolean;
};

function tabsFor(ref: SpotifyRef, subject: ShareSubject): ShareTab[] {
  const tabs: ShareTab[] = [];
  const parent = subject.parent;

  if (parent?.albumType === 'single') {
    tabs.push({ kind: 'single', label: 'Single' });
  } else if (parent) {
    tabs.push({ kind: 'album', label: 'Album' });
    // Only a shared song can pivot to a single: for a shared album there is no
    // one song to look one up for.
    if (ref.type === 'track') tabs.push({ kind: 'single', label: 'Single' });
  }

  if (subject.artistId) {
    tabs.push({ kind: 'artistAlbums', label: 'Artist albums' });
    tabs.push({ kind: 'artistSingles', label: 'Artist singles' });
  }
  return tabs;
}

/** Read the link, following a `spotify.link` short one if that is what came in. */
function useShareRef(text: string | null) {
  return useQuery({
    queryKey: ['shareRef', text],
    queryFn: async (): Promise<SpotifyRef | null> => {
      const direct = parseSpotifyRef(text);
      if (direct) return direct;

      const url = extractUrl(text);
      if (url && isSpotifyShortLink(url)) return parseSpotifyRef(await resolveSpotifyShortLink(url));
      return null;
    },
    enabled: !!text && isSpotifyConfigured(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useShareResolution(text: string | null): ShareResolution {
  const refQuery = useShareRef(text);
  const ref = refQuery.data ?? null;
  const lookupable = !!ref && ref.type !== 'playlist';

  const subjectQuery = useQuery({
    queryKey: ['shareSubject', ref?.type, ref?.id],
    queryFn: async (): Promise<ShareSubject> => {
      if (ref!.type === 'track') {
        const track = await fetchTrack(ref!.id);
        return {
          headline: track.name,
          subline: [artistsToDisplayString(track.artistNames), track.album.title].filter(Boolean).join(' • '),
          coverUrl: track.album.coverUrl,
          parent: track.album,
          trackName: track.name,
          artistId: track.artistId,
          artistName: track.artistNames[0] ?? null,
        };
      }

      if (ref!.type === 'artist') {
        const artist = await fetchArtist(ref!.id);
        return {
          headline: artist.name,
          subline: artist.genres.slice(0, 2).join(' • ') || 'Artist',
          coverUrl: artist.imageUrl,
          parent: null,
          trackName: null,
          artistId: artist.id,
          artistName: artist.name,
        };
      }

      const album = await fetchAlbum(ref!.id);
      if (!album) throw new Error('Spotify has no record of that release');
      return {
        headline: album.title,
        subline: [artistsToDisplayString(album.artist), releaseYear(album.releaseDate)].filter(Boolean).join(' • '),
        coverUrl: album.coverUrl,
        parent: album,
        trackName: null,
        artistId: album.artistIds[0] ?? null,
        artistName: album.artist[0] ?? null,
      };
    },
    enabled: lookupable,
    staleTime: 60 * 60 * 1000,
  });

  const subject = subjectQuery.data ?? null;
  const tabs = useMemo(() => (ref && subject ? tabsFor(ref, subject) : []), [ref, subject]);

  return {
    ref,
    subject,
    tabs,
    loading: refQuery.isFetching || subjectQuery.isFetching,
    error: refQuery.error ?? subjectQuery.error,
    unsupported: !refQuery.isFetching && (!ref || ref.type === 'playlist'),
    unconfigured: !isSpotifyConfigured(),
  };
}
