import {
  collectionFacets,
  filterFacets,
  groupAlbums,
  matchesArtistFilter,
  matchesFormatFilter,
  matchesStatusFilter,
  matchesYearFilter,
} from './collectionFacets';
import type { Album } from '@/types/album';

function album(overrides: Partial<Album> = {}): Album {
  return {
    id: overrides.id ?? 'a',
    userId: 'u',
    spotifyId: null,
    albumKey: `manual|${overrides.id ?? 'a'}`,
    title: overrides.title ?? 'A',
    artist: overrides.artist ?? ['Artist'],
    coverUrl: null,
    releaseDate: overrides.releaseDate ?? null,
    releaseDatePrecision: null,
    totalTracks: null,
    genres: overrides.genres ?? [],
    url: '',
    formats: overrides.formats ?? ['Vinyl'],
    status: overrides.status ?? 'Collection',
    notes: '',
    favoriteTracks: '',
    acquisitionDate: null,
    storeName: overrides.storeName ?? '',
    pricePaid: null,
    catalogNumber: '',
    customOrder: null,
    lastListenedAt: null,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('collectionFacets', () => {
  const albums = [
    album({ id: 'a', artist: ['Björk'], genres: ['Art Pop'], releaseDate: '1997-09-16', formats: ['CD'] }),
    album({ id: 'b', artist: ['Aphex Twin'], genres: ['IDM'], releaseDate: '2001-10-22', formats: ['Vinyl', 'CD'] }),
    album({ id: 'c', artist: ['Björk'], releaseDate: '2001-08-27', storeName: 'Rough Trade' }),
  ];

  it('derives options from what is actually owned, with counts', () => {
    const facets = collectionFacets(albums);
    expect(facets.artists).toEqual([
      { value: 'Aphex Twin', count: 1 },
      { value: 'Björk', count: 2 },
    ]);
    expect(facets.stores).toEqual([{ value: 'Rough Trade', count: 1 }]);
  });

  it('sorts years newest first and formats by how common they are', () => {
    const facets = collectionFacets(albums);
    expect(facets.years.map((facet) => facet.value)).toEqual(['2001', '1997']);
    expect(facets.formats[0]).toEqual({ value: 'CD', count: 2 });
  });

  it('filters an option list by substring', () => {
    expect(filterFacets([{ value: 'Art Pop', count: 1 }, { value: 'IDM', count: 2 }], 'pop')).toEqual([
      { value: 'Art Pop', count: 1 },
    ]);
  });
});

describe('matchers', () => {
  it('treats an empty selection as no narrowing', () => {
    const entry = album({ artist: ['Björk'], formats: ['CD'], releaseDate: '1997' });
    expect(matchesArtistFilter(entry, [])).toBe(true);
    expect(matchesFormatFilter(entry, [])).toBe(true);
    expect(matchesYearFilter(entry, [])).toBe(true);
  });

  it('matches any credited artist, not just the first', () => {
    const entry = album({ artist: ['Run The Jewels', 'El-P'] });
    expect(matchesArtistFilter(entry, ['El-P'])).toBe(true);
  });

  it('matches any owned format', () => {
    const entry = album({ formats: ['Vinyl', 'Digital'] });
    expect(matchesFormatFilter(entry, ['Digital'])).toBe(true);
    expect(matchesFormatFilter(entry, ['Cassette'])).toBe(false);
  });

  it('matches a year whatever the date precision', () => {
    expect(matchesYearFilter(album({ releaseDate: '1969' }), ['1969'])).toBe(true);
    expect(matchesYearFilter(album({ releaseDate: '1969-08-08' }), ['1969'])).toBe(true);
    expect(matchesYearFilter(album({ releaseDate: null }), ['1969'])).toBe(false);
  });

  it('passes everything when the status filter is all', () => {
    expect(matchesStatusFilter(album({ status: 'Wishlist' }), 'all')).toBe(true);
    expect(matchesStatusFilter(album({ status: 'Wishlist' }), 'Collection')).toBe(false);
  });
});

describe('groupAlbums', () => {
  const albums = [
    album({ id: 'a', artist: ['Björk'], releaseDate: '1997-09-16' }),
    album({ id: 'b', artist: ['Aphex Twin'], releaseDate: '2001-10-22' }),
    album({ id: 'c', releaseDate: null, genres: [] }),
  ];

  it('is null when grouping is off', () => {
    expect(groupAlbums(albums, 'none')).toBeNull();
  });

  it('groups by artist, alphabetically', () => {
    const groups = groupAlbums(albums, 'artist')!;
    expect(groups.map((group) => group.title)).toEqual(['Aphex Twin', 'Artist', 'Björk']);
  });

  it('groups by year, newest first, with a bucket for undated releases', () => {
    const groups = groupAlbums(albums, 'year')!;
    expect(groups.map((group) => group.title)).toEqual(['Unknown year', '2001', '1997']);
  });

  it('labels a release with no genre rather than dropping it', () => {
    const groups = groupAlbums([album({ id: 'x' })], 'genre')!;
    expect(groups[0].title).toBe('No genre');
  });
});
