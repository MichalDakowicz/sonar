import { groupByTier, scoreForTier, tierFor, TIERS, withReviews } from './tiers';
import type { AlbumRating, Ratings } from '@/types/album';

function rating(albumKey: string, ratings: Ratings, review = ''): AlbumRating {
  return {
    userId: 'u',
    albumKey,
    spotifyId: null,
    title: albumKey,
    artist: [],
    coverUrl: null,
    releaseDate: null,
    ratings,
    review,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('tierFor', () => {
  it('places a score in its band', () => {
    expect(tierFor(5)).toBe('S');
    expect(tierFor(4.5)).toBe('S');
    expect(tierFor(4.49)).toBe('A');
    expect(tierFor(4)).toBe('A');
    expect(tierFor(3.5)).toBe('B');
    expect(tierFor(3)).toBe('C');
    expect(tierFor(2)).toBe('D');
    expect(tierFor(1.9)).toBe('F');
    expect(tierFor(0.1)).toBe('F');
  });

  it('is null for no score, so an unrated album is on no row', () => {
    expect(tierFor(null)).toBeNull();
    expect(tierFor(undefined)).toBeNull();
    expect(tierFor(0)).toBeNull();
  });

  it('covers 0–5 with no gaps', () => {
    for (let score = 0.1; score <= 5; score += 0.1) {
      expect(tierFor(Number(score.toFixed(1)))).not.toBeNull();
    }
  });
});

describe('scoreForTier', () => {
  it('assigns a score inside the band it names', () => {
    for (const tier of TIERS) {
      const assigned = scoreForTier(tier.id);
      expect(assigned).toBeGreaterThanOrEqual(tier.min);
      // The round trip is the contract: drop into a tier, read the same tier back.
      expect(tierFor(assigned)).toBe(tier.id);
    }
  });
});

describe('groupByTier', () => {
  it('returns every tier in order, empty rows included', () => {
    const rows = groupByTier([]);
    expect(rows.map((row) => row.tier.id)).toEqual(['S', 'A', 'B', 'C', 'D', 'F']);
    expect(rows.every((row) => row.ratings.length === 0)).toBe(true);
  });

  it('files each rating under its band', () => {
    const rows = groupByTier([rating('top', { overall: 4.8 }), rating('mid', { overall: 3.6 })]);
    expect(rows[0].ratings.map((entry) => entry.albumKey)).toEqual(['top']);
    expect(rows[2].ratings.map((entry) => entry.albumKey)).toEqual(['mid']);
  });

  it('reads a facet-only rating through the same score rule', () => {
    // No overall, facets average to 4.5 → S.
    const rows = groupByTier([rating('facets', { production: 5, vocals: 4 })]);
    expect(rows[0].ratings.map((entry) => entry.albumKey)).toEqual(['facets']);
  });

  it('leaves an unrated row out of the board entirely', () => {
    const rows = groupByTier([rating('blank', {}), rating('zeroed', { overall: 0 })]);
    expect(rows.every((row) => row.ratings.length === 0)).toBe(true);
  });

  it('orders a row highest first, then by title', () => {
    const rows = groupByTier([
      rating('b', { overall: 4.2 }),
      rating('a', { overall: 4.2 }),
      rating('best', { overall: 4.4 }),
    ]);
    expect(rows[1].ratings.map((entry) => entry.albumKey)).toEqual(['best', 'a', 'b']);
  });
});

describe('withReviews', () => {
  it('keeps only ratings that carry written thoughts', () => {
    const kept = withReviews([rating('a', { overall: 4 }, 'great'), rating('b', { overall: 4 }, '   ')]);
    expect(kept.map((entry) => entry.albumKey)).toEqual(['a']);
  });
});
