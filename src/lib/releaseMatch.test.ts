import { dedupeReleases, singlesForTrack } from '@/lib/releaseMatch';

const release = (title: string, releaseDate: string | null) => ({ title, releaseDate });

describe('dedupeReleases', () => {
  it('collapses the same release repeated per market', () => {
    const result = dedupeReleases([
      release('Abbey Road', '1969-09-26'),
      release('Abbey Road', '1969-09-26'),
      release('abbey road', '1969-01-01'),
    ]);
    expect(result).toEqual([release('Abbey Road', '1969-09-26')]);
  });

  it('keeps a genuine reissue in another year', () => {
    const result = dedupeReleases([release('Abbey Road', '1969-09-26'), release('Abbey Road', '2019-09-27')]);
    expect(result).toHaveLength(2);
  });

  it('keeps the first of a duplicate pair', () => {
    const first = { title: 'Kid A', releaseDate: '2000-10-02', id: 'a' };
    const second = { title: 'Kid A', releaseDate: '2000-10-02', id: 'b' };
    expect(dedupeReleases([first, second])).toEqual([first]);
  });

  it('handles a missing release date', () => {
    expect(dedupeReleases([release('Untitled', null), release('Untitled', null)])).toHaveLength(1);
  });
});

describe('singlesForTrack', () => {
  const singles = [
    release('Heart-Shaped Box (Remix)', '1993-08-30'),
    release('Heart-Shaped Box', '1993-08-30'),
    release('All Apologies', '1993-12-06'),
  ];

  it('puts the exact title first and keeps the suffixed one', () => {
    expect(singlesForTrack(singles, 'Heart-Shaped Box').map((entry) => entry.title)).toEqual([
      'Heart-Shaped Box',
      'Heart-Shaped Box (Remix)',
    ]);
  });

  it('drops singles for other songs', () => {
    expect(singlesForTrack(singles, 'Come As You Are')).toEqual([]);
  });

  it('ignores punctuation and case the way the key does', () => {
    expect(singlesForTrack([release('Heart Shaped Box', null)], 'heart-shaped box')).toHaveLength(1);
  });

  it('matches nothing for an empty track name', () => {
    expect(singlesForTrack(singles, '  ')).toEqual([]);
  });
});
