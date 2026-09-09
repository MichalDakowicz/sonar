import { artistKey, songKey } from '@/lib/albumKey';
import { fetchAlbum, spotifyGet, toAlbum, type RawAlbum, type SpotifyAlbum } from '@/lib/spotify';
import type { SpotifyRef } from '@/lib/spotifyLink';
import {
  fetchArtist,
  fetchTrack,
  toArtist,
  toTrack,
  type RawArtist,
  type RawTrack,
  type SpotifyArtist,
  type SpotifyTrackDetail,
} from '@/lib/spotifyLookup';
import { artistsToDisplayString, releaseYear } from '@/lib/utils';
import type { RatingSubject } from '@/types/album';

/**
 * Anything that can be rated, in one shape.
 *
 * The Ratings page advertises "rate anything — album, artist or a link", and
 * now means it: a release, one song, or an artist. They come back as a single
 * type so the search list, the share sheet and the rating screen are written
 * once rather than three times over three subjects.
 */
export type RatingCandidate = {
  subject: RatingSubject;
  /** The rating key — what album_ratings is keyed by (lib/albumKey). */
  key: string;
  spotifyId: string;
  title: string;
  artist: string[];
  coverUrl: string | null;
  releaseDate: string | null;
  /** One line naming what this is: "Album · 1975", "Song · Abbey Road". */
  context: string;
  /** For a song, the release it came off — so the screen can offer that too. */
  parent?: { key: string; title: string };
};

export function albumCandidate(album: SpotifyAlbum): RatingCandidate {
  return {
    subject: 'album',
    key: album.albumKey,
    spotifyId: album.spotifyId,
    title: album.title,
    artist: album.artist,
    coverUrl: album.coverUrl,
    releaseDate: album.releaseDate,
    context: [album.albumType === 'single' ? 'Single' : 'Album', releaseYear(album.releaseDate)]
      .filter(Boolean)
      .join(' · '),
  };
}

export function songCandidate(track: SpotifyTrackDetail): RatingCandidate {
  return {
    subject: 'song',
    key: songKey(track.id),
    spotifyId: track.id,
    title: track.name,
    artist: track.artistNames,
    // A song has no art of its own; the release it came from is what you saw.
    coverUrl: track.album.coverUrl,
    releaseDate: track.album.releaseDate,
    context: ['Song', track.album.title].filter(Boolean).join(' · '),
    parent: { key: track.album.albumKey, title: track.album.title },
  };
}

export function artistCandidate(artist: SpotifyArtist): RatingCandidate {
  return {
    subject: 'artist',
    key: artistKey(artist.id),
    spotifyId: artist.id,
    title: artist.name,
    // Credited to themselves, so a rating row renders with a name under it.
    artist: [artist.name],
    coverUrl: artist.imageUrl,
    releaseDate: null,
    context: ['Artist', artist.genres[0]].filter(Boolean).join(' · '),
  };
}

type RawSearch = {
  albums?: { items: RawAlbum[] };
  tracks?: { items: RawTrack[] };
  artists?: { items: RawArtist[] };
};

/**
 * Search all three subjects in one request.
 *
 * Grouped rather than interleaved — albums, then songs, then artists — because
 * Spotify ranks within a type and not across them, so a merged list would
 * order by nothing the user can see.
 */
export async function searchSubjects(query: string, limit = 6): Promise<RatingCandidate[]> {
  if (!query.trim()) return [];
  const data = await spotifyGet<RawSearch>(
    `/search?q=${encodeURIComponent(query)}&type=album,track,artist&limit=${limit}`,
  );

  return [
    ...(data.albums?.items ?? []).map((raw) => albumCandidate(toAlbum(raw))),
    ...(data.tracks?.items ?? []).map((raw) => songCandidate(toTrack(raw))),
    ...(data.artists?.items ?? []).map((raw) => artistCandidate(toArtist(raw))),
  ];
}

/** One candidate for a pasted or shared link, whatever kind it points at. */
export async function fetchSubject(ref: SpotifyRef): Promise<RatingCandidate | null> {
  if (ref.type === 'track') return songCandidate(await fetchTrack(ref.id));
  if (ref.type === 'artist') return artistCandidate(await fetchArtist(ref.id));
  if (ref.type === 'album') {
    const album = await fetchAlbum(ref.id);
    return album ? albumCandidate(album) : null;
  }
  return null;
}

/** What a candidate is credited to, for a subtitle. Empty for an artist. */
export function candidateByline(candidate: RatingCandidate): string {
  return candidate.subject === 'artist' ? '' : artistsToDisplayString(candidate.artist);
}

/** A rating target, straight off a candidate — the same fields every time. */
export function candidateTarget(candidate: RatingCandidate) {
  return {
    albumKey: candidate.key,
    subject: candidate.subject,
    spotifyId: candidate.spotifyId,
    title: candidate.title,
    artist: candidate.artist,
    coverUrl: candidate.coverUrl,
    releaseDate: candidate.releaseDate,
  };
}
