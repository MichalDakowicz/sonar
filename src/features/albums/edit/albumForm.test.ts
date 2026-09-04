import { buildAlbumPayload, fromAlbum, isDirty, parsePrice, validate } from './albumForm';
import type { Album } from '@/types/album';

function album(overrides: Partial<Album> = {}): Album {
  return {
    id: 'row-1',
    userId: 'u',
    spotifyId: null,
    albumKey: 'manual:daft-punk|discovery',
    title: 'Discovery',
    artist: ['Daft Punk'],
    coverUrl: null,
    releaseDate: '2001-03-12',
    releaseDatePrecision: 'day',
    totalTracks: 14,
    genres: [],
    url: '',
    formats: ['Vinyl'],
    status: 'Collection',
    notes: '',
    favoriteTracks: '',
    acquisitionDate: null,
    storeName: '',
    pricePaid: null,
    catalogNumber: '',
    customOrder: null,
    lastListenedAt: null,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('parsePrice', () => {
  it('reads a typed number, comma decimal included', () => {
    expect(parsePrice('24.99')).toBe(24.99);
    expect(parsePrice('24,99')).toBe(24.99);
  });

  it('reads an empty box as no price, not as zero', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('   ')).toBeNull();
  });

  it('rejects nonsense and negatives', () => {
    expect(parsePrice('free')).toBeNull();
    expect(parsePrice('-5')).toBeNull();
  });
});

describe('validate', () => {
  it('accepts an untouched form off a real row', () => {
    expect(validate(fromAlbum(album()))).toEqual({});
  });

  it('demands a title', () => {
    expect(validate({ ...fromAlbum(album()), title: '  ' }).title).toBeDefined();
  });

  it('accepts an empty acquired date but not a malformed one', () => {
    expect(validate({ ...fromAlbum(album()), acquisitionDate: '' }).acquisitionDate).toBeUndefined();
    expect(validate({ ...fromAlbum(album()), acquisitionDate: '03/12/2001' }).acquisitionDate).toBeDefined();
  });

  it('flags a price that is not a number', () => {
    expect(validate({ ...fromAlbum(album()), pricePaid: 'a lot' }).pricePaid).toBeDefined();
  });
});

describe('buildAlbumPayload', () => {
  it('sends null rather than an empty string for the nullable columns', () => {
    const payload = buildAlbumPayload({ ...fromAlbum(album()), acquisitionDate: '', coverUrl: '', pricePaid: '' });
    expect(payload.acquisitionDate).toBeNull();
    expect(payload.coverUrl).toBeNull();
    expect(payload.pricePaid).toBeNull();
  });

  it('trims what the user typed', () => {
    const payload = buildAlbumPayload({ ...fromAlbum(album()), title: '  Homework  ', storeName: ' Rough Trade ' });
    expect(payload.title).toBe('Homework');
    expect(payload.storeName).toBe('Rough Trade');
  });

  it('treats a record with every format unticked as Digital', () => {
    const payload = buildAlbumPayload({ ...fromAlbum(album()), formats: [] });
    expect(payload.formats).toEqual(['Digital']);
  });
});

describe('isDirty', () => {
  it('is false for a form straight off the row', () => {
    const row = album();
    expect(isDirty(fromAlbum(row), row)).toBe(false);
  });

  it('notices an edit to any editable field', () => {
    const row = album();
    expect(isDirty({ ...fromAlbum(row), notes: 'scratchy but great' }, row)).toBe(true);
    expect(isDirty({ ...fromAlbum(row), formats: ['Vinyl', 'Digital'] }, row)).toBe(true);
    expect(isDirty({ ...fromAlbum(row), status: 'Wishlist' }, row)).toBe(true);
  });
});
