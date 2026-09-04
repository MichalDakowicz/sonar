import { canReorder, compareAlbums, orderBetween, shelfOrder, SORT_DEFAULT_DIR } from './collectionSort';
import type { Album } from '@/types/album';

function album(overrides: Partial<Album> = {}): Album {
  return {
    id: overrides.id ?? 'a',
    userId: 'u',
    spotifyId: null,
    albumKey: overrides.albumKey ?? `manual:x|${overrides.title ?? 'a'}`,
    title: overrides.title ?? 'A',
    artist: overrides.artist ?? ['Artist'],
    coverUrl: null,
    releaseDate: overrides.releaseDate ?? null,
    releaseDatePrecision: null,
    totalTracks: null,
    genres: [],
    url: '',
    formats: ['Digital'],
    status: overrides.status ?? 'Collection',
    notes: '',
    favoriteTracks: '',
    acquisitionDate: null,
    storeName: '',
    pricePaid: overrides.pricePaid ?? null,
    catalogNumber: '',
    customOrder: overrides.customOrder ?? null,
    lastListenedAt: overrides.lastListenedAt ?? null,
    addedAt: overrides.addedAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const noScores = { scoreFor: () => 0 };

describe('shelfOrder', () => {
  it('uses customOrder when a record has been dragged', () => {
    expect(shelfOrder(album({ customOrder: 42 }))).toBe(42);
  });

  it('falls back to negated add time, so an untouched shelf reads newest-first', () => {
    const older = album({ addedAt: '2026-01-01T00:00:00.000Z' });
    const newer = album({ addedAt: '2026-06-01T00:00:00.000Z' });
    expect(shelfOrder(newer)).toBeLessThan(shelfOrder(older));
  });
});

describe('orderBetween', () => {
  it('puts a record before the first one', () => {
    const first = album({ customOrder: 0 });
    expect(orderBetween(undefined, first)).toBeLessThan(0);
  });

  it('puts a record after the last one', () => {
    const last = album({ customOrder: 0 });
    expect(orderBetween(last, undefined)).toBeGreaterThan(0);
  });

  it('takes the midpoint between two neighbours', () => {
    expect(orderBetween(album({ customOrder: 100 }), album({ customOrder: 200 }))).toBe(150);
  });
});

describe('compareAlbums', () => {
  it('sorts by title ascending', () => {
    const list = [album({ title: 'Zoo' }), album({ title: 'Apple' })];
    list.sort((a, b) => compareAlbums(a, b, 'title', 'asc', noScores));
    expect(list.map((entry) => entry.title)).toEqual(['Apple', 'Zoo']);
  });

  it('sorts by rating using the injected score', () => {
    const good = album({ id: 'good', albumKey: 'k-good' });
    const bad = album({ id: 'bad', albumKey: 'k-bad' });
    const scoreFor = (entry: Album) => (entry.albumKey === 'k-good' ? 4.5 : 1);
    const list = [bad, good];
    list.sort((a, b) => compareAlbums(a, b, 'rating', 'desc', { scoreFor }));
    expect(list[0].id).toBe('good');
  });

  it('treats a never-played record as older than any play', () => {
    const played = album({ id: 'played', lastListenedAt: '2026-01-01T00:00:00.000Z' });
    const never = album({ id: 'never' });
    const list = [never, played];
    list.sort((a, b) => compareAlbums(a, b, 'lastListened', 'desc', noScores));
    expect(list[0].id).toBe('played');
  });

  it('breaks ties on title so the grid never reshuffles between renders', () => {
    const b = album({ id: 'b', title: 'B' });
    const a = album({ id: 'a', title: 'A' });
    // Same (absent) price, so the price comparison is a tie.
    expect(compareAlbums(b, a, 'price', 'asc', noScores)).toBeGreaterThan(0);
    expect(compareAlbums(a, b, 'price', 'asc', noScores)).toBeLessThan(0);
  });

  it('every sort has a natural direction', () => {
    expect(SORT_DEFAULT_DIR.dateAdded).toBe('desc');
    expect(SORT_DEFAULT_DIR.title).toBe('asc');
  });
});

describe('canReorder', () => {
  const base = { sortBy: 'custom' as const, groupBy: 'none', searchQuery: '', activeFilterCount: 0 };

  it('allows hand order only on the whole, unsorted shelf', () => {
    expect(canReorder(base)).toBe(true);
    expect(canReorder({ ...base, sortBy: 'title' })).toBe(false);
    expect(canReorder({ ...base, groupBy: 'artist' })).toBe(false);
    expect(canReorder({ ...base, searchQuery: 'kid a' })).toBe(false);
    expect(canReorder({ ...base, activeFilterCount: 1 })).toBe(false);
  });
});
