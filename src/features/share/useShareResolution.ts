import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { isSpotifyConfigured, fetchAlbum, type SpotifyAlbum } from '@/lib/spotify';
import { extractUrl, isSpotifyShortLink, parseSpotifyRef, type SpotifyRef } from '@/lib/spotifyLink';
import {
  fetchArtist,
  fetchTrack,
  resolveSpotifyShortLink,
  type SpotifyArtist,
  type SpotifyTrackDetail,
} from '@/lib/spotifyLookup';
import { artistsToDisplayString, releaseYear } from '@/lib/utils';

/**
 * What was shared, and everything it could reasonably mean.
 *
 * A share names one thing, and Sonar can act on several: the song itself, the
 * release it sits on, the artist, or any other record of theirs. Two of those
 * are rate-only and two can be shelved, so a link resolves to a set of *tabs*,
 * each of which produces options (useShareOptions), and the choice stays the
 * user's.
 */

export type ShareTabKind = 'song' | 'album' | 'artist' | 'artistAlbums' | 'artistSingles';
export type ShareTab = { kind: ShareTabKind; label: string };

export type ShareSubject = {
  headline: string;
  subline: string;
  coverUrl: string | null;
  /** The release the link pointed at, or pointed into for a song. */
  parent: SpotifyAlbum | null;
  /** Set only for a shared song. */
  track: SpotifyTrackDetail | null;
  /** Set only for a shared artist — otherwise the artist tab fetches them. */
  artist: SpotifyArtist | null;
  artistId: string | null;
  artistName: string | null;
};

export type ShareResolution = {
  ref: SpotifyRef | null;
  subject: ShareSubject | null;
  tabs: ShareTab[];
  loading: boolean;
  error: unknown;
  /** Parseable, but a playlist — Sonar has no opinion shape for one. */
  unsupported: boolean;
  unconfigured: boolean;
};

function tabsFor(subject: ShareSubject): ShareTab[] {
  const tabs: ShareTab[] = [];

  // The song leads when a song was shared: it is what the user was listening to.
  if (subject.track) tabs.push({ kind: 'song', label: 'Song' });
  if (subject.parent) {
    tabs.push({ kind: 'album', label: subject.parent.albumType === 'single' ? 'Single' : 'Album' });
  }
  if (subject.artistId) {
    tabs.push({ kind: 'artist', label: 'Artist' });
    tabs.push({ kind: 'artistAlbums', label: 'Albums' });
    tabs.push({ kind: 'artistSingles', label: 'Singles' });
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
      if (ref!.type === 'track') return trackSubject(await fetchTrack(ref!.id));
      if (ref!.type === 'artist') return artistSubject(await fetchArtist(ref!.id));

      const album = await fetchAlbum(ref!.id);
      if (!album) throw new Error('Spotify has no record of that release');
      return albumSubject(album);
    },
    enabled: lookupable,
    staleTime: 60 * 60 * 1000,
  });

  const subject = subjectQuery.data ?? null;
  const tabs = useMemo(() => (subject ? tabsFor(subject) : []), [subject]);

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

function trackSubject(track: SpotifyTrackDetail): ShareSubject {
  return {
    headline: track.name,
    subline: [artistsToDisplayString(track.artistNames), track.album.title].filter(Boolean).join(' • '),
    coverUrl: track.album.coverUrl,
    parent: track.album,
    track,
    artist: null,
    artistId: track.artistId,
    artistName: track.artistNames[0] ?? null,
  };
}

function albumSubject(album: SpotifyAlbum): ShareSubject {
  return {
    headline: album.title,
    subline: [artistsToDisplayString(album.artist), releaseYear(album.releaseDate)].filter(Boolean).join(' • '),
    coverUrl: album.coverUrl,
    parent: album,
    track: null,
    artist: null,
    artistId: album.artistIds[0] ?? null,
    artistName: album.artist[0] ?? null,
  };
}

function artistSubject(artist: SpotifyArtist): ShareSubject {
  return {
    headline: artist.name,
    subline: artist.genres.slice(0, 2).join(' • ') || 'Artist',
    coverUrl: artist.imageUrl,
    parent: null,
    track: null,
    artist,
    artistId: artist.id,
    artistName: artist.name,
  };
}
