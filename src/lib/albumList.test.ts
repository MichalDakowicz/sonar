import { removeAlbumById, upsertAlbum } from './albumList';
import type { Album } from '@/types/album';

const album = (id: string, addedAt: string, title = id): Album => ({ id, addedAt, title }) as Album;

describe('upsertAlbum', () => {
  const list = [album('c', '2026-03-01'), album('b', '2026-02-01'), album('a', '2026-01-01')];

  it('replaces an existing row in place without reordering', () => {
    const next = upsertAlbum(list, album('b', '2026-02-01', 'renamed'));
    expect(next.map((a) => a.id)).toEqual(['c', 'b', 'a']);
    expect(next[1].title).toBe('renamed');
  });

  it('does not mutate the list it was given', () => {
    upsertAlbum(list, album('b', '2026-02-01', 'renamed'));
    expect(list[1].title).toBe('b');
  });

  it('puts a new row where its added_at belongs', () => {
    expect(upsertAlbum(list, album('d', '2026-04-01')).map((a) => a.id)).toEqual(['d', 'c', 'b', 'a']);
    expect(upsertAlbum(list, album('x', '2026-02-15')).map((a) => a.id)).toEqual(['c', 'x', 'b', 'a']);
    expect(upsertAlbum(list, album('z', '2025-12-01')).map((a) => a.id)).toEqual(['c', 'b', 'a', 'z']);
  });

  it('seeds an empty list', () => {
    expect(upsertAlbum([], album('a', '2026-01-01')).map((a) => a.id)).toEqual(['a']);
  });
});

describe('removeAlbumById', () => {
  const list = [album('b', '2026-02-01'), album('a', '2026-01-01')];

  it('drops the row', () => {
    expect(removeAlbumById(list, 'b').map((a) => a.id)).toEqual(['a']);
  });

  it('returns the same array when nothing matched', () => {
    expect(removeAlbumById(list, 'nope')).toBe(list);
  });
});
