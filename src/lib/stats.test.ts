import { personalScore } from './personalScore';
import { computeStats } from './stats';
import type { Album, AlbumRating, Spin } from '@/types/album';

function album(overrides: Partial<Album> = {}): Album {
  return {
    id: overrides.id ?? 'a',
    userId: 'u',
    spotifyId: null,
    albumKey: overrides.albumKey ?? `manual|${overrides.id ?? 'a'}`,
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
    pricePaid: overrides.pricePaid ?? null,
    catalogNumber: '',
    customOrder: null,
    lastListenedAt: null,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function rating(albumKey: string, overall: number): AlbumRating {
  return {
    userId: 'u',
    albumKey,
    spotifyId: null,
    title: 'T',
    artist: [],
    coverUrl: null,
    releaseDate: null,
    ratings: { overall },
    review: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function spin(albumId: string): Spin {
  return {
    id: `${albumId}-1`,
    userId: 'u',
    albumId,
    albumKey: null,
    title: 'T',
    artist: [],
    coverUrl: null,
    playedAt: '2026-06-01T12:00:00.000Z',
  };
}

const scoreOf = (entry: AlbumRating) => personalScore(entry.ratings);

describe('computeStats', () => {
  it('counts only owned records as the collection', () => {
    const stats = computeStats({
      albums: [album({ id: 'a' }), album({ id: 'b', status: 'Wishlist' }), album({ id: 'c', status: 'Pre-order' })],
      spins: [],
      ratings: [],
      scoreOf,
    });
    expect(stats.totalAlbums).toBe(1);
    expect(stats.wishlistCount).toBe(1);
    expect(stats.preOrderCount).toBe(1);
  });

  it('keeps a wishlist price out of what you have spent', () => {
    const stats = computeStats({
      albums: [album({ id: 'a', pricePaid: 20 }), album({ id: 'b', status: 'Wishlist', pricePaid: 999 })],
      spins: [],
      ratings: [],
      scoreOf,
    });
    expect(stats.totalValue).toBe(20);
    expect(stats.averagePrice).toBe(20);
  });

  it('counts a record owned on two media once per format', () => {
    const stats = computeStats({
      albums: [album({ id: 'a', formats: ['Vinyl', 'Digital'] })],
      spins: [],
      ratings: [],
      scoreOf,
    });
    expect(stats.formats.map((slice) => [slice.name, slice.count])).toEqual([
      ['Digital', 1],
      ['Vinyl', 1],
    ]);
    expect(stats.totalAlbums).toBe(1);
  });

  it('counts every credited artist, and reports how many are unique', () => {
    const stats = computeStats({
      albums: [album({ id: 'a', artist: ['A', 'B'] }), album({ id: 'b', artist: ['A'] })],
      spins: [],
      ratings: [],
      scoreOf,
    });
    expect(stats.uniqueArtists).toBe(2);
    expect(stats.topArtists[0]).toEqual({ name: 'A', count: 2, percent: 100 });
  });

  it('buckets releases into decades in chronological order', () => {
    const stats = computeStats({
      albums: [album({ id: 'a', releaseDate: '1971-03-01' }), album({ id: 'b', releaseDate: '1969' })],
      spins: [],
      ratings: [],
      scoreOf,
    });
    expect(stats.decades).toEqual([
      { decade: '1960s', count: 1 },
      { decade: '1970s', count: 1 },
    ]);
  });

  it('averages every rating, including ones for records not on the shelf', () => {
    const stats = computeStats({
      albums: [album({ id: 'a', albumKey: 'k-a' })],
      spins: [],
      ratings: [rating('k-a', 4), rating('k-gone', 2)],
      scoreOf,
    });
    expect(stats.ratedCount).toBe(2);
    expect(stats.averageRating).toBe(3);
    // …but "rated highest" can only link to a record that exists.
    expect(stats.bestRated.map((entry) => entry.album.id)).toEqual(['a']);
  });

  it('ranks most spun from the log it was given', () => {
    const stats = computeStats({
      albums: [album({ id: 'a' }), album({ id: 'b' })],
      spins: [spin('a'), spin('a'), spin('b')],
      ratings: [],
      scoreOf,
    });
    expect(stats.mostSpun.map((entry) => [entry.album.id, entry.count])).toEqual([
      ['a', 2],
      ['b', 1],
    ]);
    expect(stats.spins.totalSpins).toBe(3);
  });

  it('reports empty rather than dividing by zero on a bare account', () => {
    const stats = computeStats({ albums: [], spins: [], ratings: [], scoreOf });
    expect(stats.totalAlbums).toBe(0);
    expect(stats.averagePrice).toBeNull();
    expect(stats.averageRating).toBeNull();
  });
});
