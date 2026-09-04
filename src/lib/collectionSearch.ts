import type { Album } from '@/types/album';

type SearchableAlbum = Pick<Album, 'title' | 'artist' | 'genres' | 'releaseDate' | 'catalogNumber'>;

/**
 * What the collection search box matches, ported from the legacy Home.jsx
 * filter and widened: title and artist as before, plus genre, release year and
 * catalogue number — the three things you actually have in front of you when
 * you are holding the sleeve and trying to find its row.
 */
export function albumMatchesSearchQuery(album: SearchableAlbum, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  const titleMatch = album.title?.toLowerCase().includes(lower) ?? false;
  const artistMatch = album.artist.join(' ').toLowerCase().includes(lower);
  const genreMatch = album.genres.some((genre) => genre.toLowerCase().includes(lower));
  const yearMatch = !!album.releaseDate && album.releaseDate.startsWith(trimmed);
  const catalogMatch = !!album.catalogNumber && album.catalogNumber.toLowerCase().includes(lower);

  return titleMatch || artistMatch || genreMatch || yearMatch || catalogMatch;
}
