import { buildExportPayload, isDuplicate, parseImport } from './dataTransfer';
import type { Album, AlbumRating, Spin } from '@/types/album';

function album(overrides: Partial<Album> = {}): Album {
  return {
    id: overrides.id ?? 'row-1',
    userId: 'u',
    spotifyId: overrides.spotifyId ?? null,
    albumKey: overrides.albumKey ?? 'manual:radiohead|kid-a',
    title: overrides.title ?? 'Kid A',
    artist: overrides.artist ?? ['Radiohead'],
    coverUrl: null,
    releaseDate: '2000-10-02',
    releaseDatePrecision: 'day',
    totalTracks: 10,
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

describe('buildExportPayload', () => {
  it('drops the identity fields that are re-minted on import', () => {
    const payload = buildExportPayload([album()], [], [], '2026-06-01T00:00:00.000Z');
    expect(payload.albums[0]).not.toHaveProperty('id');
    expect(payload.albums[0]).not.toHaveProperty('userId');
    expect(payload.counts).toEqual({ albums: 1, ratings: 0, spins: 0 });
  });

  it('carries ratings and spins, not just the collection', () => {
    const rating: AlbumRating = {
      userId: 'u',
      albumKey: 'k',
      subject: 'album',
      spotifyId: null,
      title: 'T',
      artist: [],
      coverUrl: null,
      releaseDate: null,
      ratings: { overall: 4 },
      review: 'good',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const spin: Spin = {
      id: 's',
      userId: 'u',
      albumId: 'row-1',
      albumKey: 'k',
      title: 'T',
      artist: [],
      coverUrl: null,
      playedAt: '2026-05-01T00:00:00.000Z',
    };
    const payload = buildExportPayload([], [rating], [spin], '2026-06-01T00:00:00.000Z');
    expect(payload.ratings[0].review).toBe('good');
    expect(payload.spins[0]).not.toHaveProperty('albumId');
  });
});

describe('parseImport', () => {
  it('rejects nonsense with a readable error rather than throwing', () => {
    expect(parseImport('not json').errors[0]).toMatch(/Invalid JSON/);
    expect(parseImport('   ').errors[0]).toMatch(/Nothing to import/);
    expect(parseImport('{"foo":1}').errors[0]).toMatch(/Unrecognised/);
  });

  it('reads a Sonar export back', () => {
    const json = JSON.stringify(buildExportPayload([album()], [], [], '2026-06-01T00:00:00.000Z'));
    const parsed = parseImport(json);
    expect(parsed.albums).toHaveLength(1);
    expect(parsed.albums[0].albumKey).toBe('manual:radiohead|kid-a');
  });

  it('reads a bare array of albums', () => {
    const parsed = parseImport(JSON.stringify([{ title: 'Kid A', artist: ['Radiohead'] }]));
    expect(parsed.albums[0].albumKey).toBe('manual:radiohead|kid-a');
  });

  it('reads the legacy Firebase export: keyed objects, `format`, epoch millis', () => {
    const legacy = {
      albums: {
        '-Nabc': {
          title: 'Discovery',
          artist: 'Daft Punk',
          format: 'Vinyl',
          addedAt: 1700000000000,
          lastListened: 1700086400000,
          rating: 4.5,
        },
      },
      history: {
        '-Nxyz': { albumId: '-Nabc', title: 'Discovery', artist: 'Daft Punk', timestamp: 1700086400000 },
      },
    };
    const parsed = parseImport(JSON.stringify(legacy));

    expect(parsed.albums).toHaveLength(1);
    expect(parsed.albums[0].formats).toEqual(['Vinyl']);
    expect(parsed.albums[0].artist).toEqual(['Daft Punk']);
    expect(parsed.albums[0].addedAt).toBe(new Date(1700000000000).toISOString());
    expect(parsed.albums[0].lastListenedAt).toBe(new Date(1700086400000).toISOString());
    // The legacy single `rating` becomes an overall score on a rating row.
    expect(parsed.ratings[0].ratings).toEqual({ overall: 4.5 });
    expect(parsed.spins).toHaveLength(1);
  });

  it('skips an album with no title, and says so', () => {
    const parsed = parseImport(JSON.stringify([{ artist: ['Nobody'] }]));
    expect(parsed.albums).toHaveLength(0);
    expect(parsed.errors[0]).toMatch(/missing title/);
  });

  it('lets an explicit rating row win over one rebuilt from an album', () => {
    const parsed = parseImport(
      JSON.stringify({
        albums: [{ title: 'Kid A', artist: ['Radiohead'], rating: 3 }],
        ratings: [{ albumKey: 'manual:radiohead|kid-a', title: 'Kid A', ratings: { overall: 5 } }],
      }),
    );
    expect(parsed.ratings).toHaveLength(1);
    expect(parsed.ratings[0].ratings.overall).toBe(5);
  });
});

describe('isDuplicate', () => {
  it('matches on release key, so re-importing a backup adds nothing', () => {
    const existing = [album()];
    expect(isDuplicate({ title: 'Kid A', albumKey: 'manual:radiohead|kid-a' }, existing)).toBe(true);
    expect(isDuplicate({ title: 'Amnesiac', albumKey: 'manual:radiohead|amnesiac' }, existing)).toBe(false);
  });

  it('falls back to a case-insensitive title when a key is missing', () => {
    expect(isDuplicate({ title: 'kid a' }, [album()])).toBe(true);
  });
});
