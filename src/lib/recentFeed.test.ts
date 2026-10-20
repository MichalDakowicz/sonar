import { isActivityInsert, mergeRecent } from './recentFeed';

const item = (id: string, day: number) => ({ id, createdAt: `2026-10-${String(day).padStart(2, '0')}T00:00:00Z` });

it('handles duplicate and out-of-order inserts without growing or mutating the cached page', () => {
  const cached = [item('new', 15), item('old', 12)];
  expect(mergeRecent(cached, item('middle', 14), 2).map(row => row.id)).toEqual(['new', 'middle']);
  expect(mergeRecent(cached, item('new', 16), 2)).toEqual([item('new', 16), item('old', 12)]);
  expect(cached).toEqual([item('new', 15), item('old', 12)]);
  expect(mergeRecent(cached, item('ancient', 1), 2)).toEqual(cached);
  expect(mergeRecent([], item('only', 1), 0)).toEqual([]);
});

it('orders equal timestamps deterministically', () => {
  expect(mergeRecent([item('z', 15)], item('a', 15), 2).map(row => row.id)).toEqual(['a', 'z']);
});

it.each(['album', 'book'] as const)('requires a complete %s INSERT before using its data', domain => {
  const row = { id: 'event', user_id: 'friend', type: 'added', created_at: item('x', 15).createdAt,
    [`${domain}_id`]: null, [`${domain}_key`]: null, [`${domain}_title`]: 'Title', details: null };
  expect(isActivityInsert(row, domain)).toBe(true);
  for (const key of ['id', 'user_id', 'created_at', `${domain}_id`, `${domain}_key`, `${domain}_title`, 'details']) {
    const partial = { ...row };
    delete partial[key as keyof typeof partial];
    expect(isActivityInsert(partial, domain)).toBe(false);
  }
  expect(isActivityInsert({ ...row, details: [] }, domain)).toBe(false);
  expect(isActivityInsert({ ...row, created_at: 'not a date' }, domain)).toBe(false);
});
