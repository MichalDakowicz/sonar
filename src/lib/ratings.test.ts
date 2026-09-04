import { personalScore } from './personalScore';
import { isEmptyRatings, recalcOverall, toFacetValues, toRatingsPayload } from './ratings';

describe('personalScore', () => {
  it('prefers an explicit overall', () => {
    expect(personalScore({ overall: 4.2, production: 5 })).toBe(4.2);
  });

  it('averages the facets that were answered', () => {
    expect(personalScore({ production: 4, vocals: 5 })).toBe(4.5);
  });

  it('ignores unanswered facets rather than counting them as zero', () => {
    expect(personalScore({ production: 4, vocals: 0 })).toBe(4);
  });

  it('is null when nothing is scored', () => {
    expect(personalScore({})).toBeNull();
    expect(personalScore(null)).toBeNull();
    expect(personalScore({ overall: 0 })).toBeNull();
  });
});

describe('recalcOverall', () => {
  it('rounds the facet average to one decimal', () => {
    expect(recalcOverall({ production: 4, vocals: 5, lyrics: 4, replay: 0 })).toBe(4.3);
  });

  it('is null on an untouched form, so "average" cannot stamp a 0.0', () => {
    expect(recalcOverall({ production: 0, vocals: 0, lyrics: 0, replay: 0 })).toBeNull();
  });
});

describe('toRatingsPayload', () => {
  it('drops unanswered facets instead of storing zeroes', () => {
    expect(toRatingsPayload({ production: 4, vocals: 0, lyrics: 0, replay: 3 }, 3.5)).toEqual({
      production: 4,
      replay: 3,
      overall: 3.5,
    });
  });

  it('omits the overall when it was never set', () => {
    expect(toRatingsPayload({ production: 4, vocals: 0, lyrics: 0, replay: 0 }, 0)).toEqual({ production: 4 });
  });

  it('round-trips through toFacetValues', () => {
    const payload = toRatingsPayload({ production: 4, vocals: 3.5, lyrics: 0, replay: 0 }, 0);
    expect(toFacetValues(payload)).toEqual({ production: 4, vocals: 3.5, lyrics: 0, replay: 0 });
  });
});

describe('isEmptyRatings', () => {
  it('recognises an emptied form, which is what deletes the row', () => {
    expect(isEmptyRatings({})).toBe(true);
    expect(isEmptyRatings({ overall: 0 })).toBe(true);
    expect(isEmptyRatings({ replay: 1 })).toBe(false);
  });
});
