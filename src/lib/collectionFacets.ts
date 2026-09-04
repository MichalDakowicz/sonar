import type { Album, AlbumStatus, Format } from '@/types/album';

/** One filter option, with how many albums it would match. */
export type Facet = { value: string; count: number };

export type CollectionFacets = {
  artists: Facet[];
  genres: Facet[];
  years: Facet[];
  formats: Facet[];
  stores: Facet[];
};

function tally(values: Iterable<string>, counts: Map<string, number>) {
  for (const value of values) {
    const clean = value.trim();
    if (clean) counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
}

function toFacets(counts: Map<string, number>, order: 'alpha' | 'desc-value' | 'count'): Facet[] {
  const list = [...counts].map(([value, count]) => ({ value, count }));
  if (order === 'desc-value') return list.sort((a, b) => b.value.localeCompare(a.value));
  if (order === 'count') return list.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  return list.sort((a, b) => a.value.localeCompare(b.value));
}

/**
 * Every filter dimension, derived from the albums the user actually owns — so
 * there is never a chip that matches nothing. Years sort newest first, artists
 * and genres alphabetically, formats and stores by how common they are.
 */
export function collectionFacets(albums: Album[]): CollectionFacets {
  const artists = new Map<string, number>();
  const genres = new Map<string, number>();
  const years = new Map<string, number>();
  const formats = new Map<string, number>();
  const stores = new Map<string, number>();

  for (const album of albums) {
    tally(album.artist, artists);
    tally(album.genres, genres);
    tally(album.formats, formats);
    if (album.storeName) tally([album.storeName], stores);
    if (album.releaseDate && album.releaseDate.length >= 4) tally([album.releaseDate.slice(0, 4)], years);
  }

  return {
    artists: toFacets(artists, 'alpha'),
    genres: toFacets(genres, 'alpha'),
    years: toFacets(years, 'desc-value'),
    formats: toFacets(formats, 'count'),
    stores: toFacets(stores, 'count'),
  };
}

export function filterFacets(facets: Facet[], query: string): Facet[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return facets;
  return facets.filter((facet) => facet.value.toLowerCase().includes(trimmed));
}

// An empty selection means "no narrowing", not "match nothing" — every one of
// these returns true when nothing is picked.

export function matchesArtistFilter(album: Album, selected: string[]): boolean {
  return selected.length === 0 || album.artist.some((artist) => selected.includes(artist));
}

export function matchesGenreFilter(album: Album, selected: string[]): boolean {
  return selected.length === 0 || album.genres.some((genre) => selected.includes(genre));
}

export function matchesYearFilter(album: Album, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return !!album.releaseDate && selected.includes(album.releaseDate.slice(0, 4));
}

export function matchesFormatFilter(album: Album, selected: string[]): boolean {
  return selected.length === 0 || album.formats.some((format) => selected.includes(format));
}

export function matchesStatusFilter(album: Album, filter: AlbumStatus | 'all'): boolean {
  return filter === 'all' || album.status === filter;
}

/** Group key for one album under the chosen dimension. */
export type GroupBy = 'none' | 'artist' | 'year' | 'genre' | 'format' | 'status';

export function groupKeyFor(album: Album, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'artist':
      return album.artist[0] || 'Unknown artist';
    case 'year':
      return album.releaseDate ? album.releaseDate.slice(0, 4) : 'Unknown year';
    case 'genre':
      return album.genres[0] || 'No genre';
    case 'format':
      return (album.formats[0] as Format | undefined) ?? 'Digital';
    case 'status':
      return album.status;
    default:
      return '';
  }
}

export type AlbumGroup = { title: string; albums: Album[] };

/** Buckets an already filtered+sorted list. Years descend; everything else A-Z. */
export function groupAlbums(albums: Album[], groupBy: GroupBy): AlbumGroup[] | null {
  if (groupBy === 'none') return null;

  const groups = new Map<string, Album[]>();
  for (const album of albums) {
    const key = groupKeyFor(album, groupBy);
    const bucket = groups.get(key);
    if (bucket) bucket.push(album);
    else groups.set(key, [album]);
  }

  const keys = [...groups.keys()].sort((a, b) => (groupBy === 'year' ? b.localeCompare(a) : a.localeCompare(b)));
  return keys.map((title) => ({ title, albums: groups.get(title)! }));
}
