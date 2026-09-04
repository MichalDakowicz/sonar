import { listeningStreak, localDateKey, recentlyPlayed, spinsPerDay, summarizeSpins, topSpun } from './spins';
import type { Album, Spin } from '@/types/album';

function spin(albumId: string | null, playedAt: string, id = `${albumId}-${playedAt}`): Spin {
  return { id, userId: 'u', albumId, albumKey: null, title: 'T', artist: [], coverUrl: null, playedAt };
}

function album(id: string, title = id): Album {
  return {
    id,
    userId: 'u',
    spotifyId: null,
    albumKey: `manual|${id}`,
    title,
    artist: [],
    coverUrl: null,
    releaseDate: null,
    releaseDatePrecision: null,
    totalTracks: null,
    genres: [],
    url: '',
    formats: ['Digital'],
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
  };
}

// A local noon so a day bucket cannot straddle midnight in either direction.
function at(day: number, hour = 12): string {
  return new Date(2026, 5, day, hour).toISOString();
}

describe('summarizeSpins', () => {
  it('takes the newest play per album from a newest-first log', () => {
    const summary = summarizeSpins([spin('a', at(10)), spin('a', at(3)), spin('b', at(5))]);
    expect(summary.lastPlayedById.get('a')).toBe(at(10));
    expect(summary.countById.get('a')).toBe(2);
    expect(summary.totalSpins).toBe(3);
  });

  it('skips spins whose album row is gone', () => {
    const summary = summarizeSpins([spin(null, at(1))]);
    expect(summary.countById.size).toBe(0);
    expect(summary.totalSpins).toBe(1);
  });
});

describe('topSpun', () => {
  it('ranks by play count and leaves unplayed records out', () => {
    const albums = [album('a'), album('b'), album('c')];
    const summary = summarizeSpins([spin('a', at(3)), spin('a', at(2)), spin('b', at(1))]);
    expect(topSpun(albums, summary).map((entry) => entry.album.id)).toEqual(['a', 'b']);
  });
});

describe('recentlyPlayed', () => {
  it('lists each album once, newest play first', () => {
    const albums = [album('a'), album('b')];
    const played = recentlyPlayed(albums, [spin('b', at(9)), spin('a', at(8)), spin('b', at(2))]);
    expect(played.map((entry) => entry.id)).toEqual(['b', 'a']);
  });
});

describe('spinsPerDay', () => {
  it('returns every day in the window, zeroes included', () => {
    const now = new Date(2026, 5, 10, 12).getTime();
    const perDay = spinsPerDay([spin('a', at(10)), spin('a', at(10, 20))], 3, now);
    expect(perDay).toHaveLength(3);
    expect(perDay[2]).toEqual({ date: localDateKey(new Date(2026, 5, 10)), count: 2 });
    expect(perDay[0].count).toBe(0);
  });
});

describe('listeningStreak', () => {
  it('counts consecutive days up to today', () => {
    const now = new Date(2026, 5, 10, 9).getTime();
    expect(listeningStreak([spin('a', at(10)), spin('a', at(9)), spin('a', at(8))], now)).toBe(3);
  });

  it('stays alive on a day with nothing played yet, counting back from yesterday', () => {
    const now = new Date(2026, 5, 11, 9).getTime();
    expect(listeningStreak([spin('a', at(10)), spin('a', at(9))], now)).toBe(2);
  });

  it('is broken once two days have gone by', () => {
    const now = new Date(2026, 5, 12, 9).getTime();
    expect(listeningStreak([spin('a', at(10))], now)).toBe(0);
  });

  it('is zero with nothing logged', () => {
    expect(listeningStreak([])).toBe(0);
  });
});
