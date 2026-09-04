import { albumKey, artistList, isSpotifyKey, spotifyIdFromKey } from './albumKey';

describe('artistList', () => {
  it('keeps an array as-is, trimmed', () => {
    expect(artistList([' Radiohead ', 'Björk', ''])).toEqual(['Radiohead', 'Björk']);
  });

  it('splits a legacy semicolon string', () => {
    expect(artistList('Run The Jewels; El-P')).toEqual(['Run The Jewels', 'El-P']);
  });

  it('leaves a comma alone — plenty of acts have one in their name', () => {
    expect(artistList('Earth, Wind & Fire')).toEqual(['Earth, Wind & Fire']);
  });

  it('reads nothing as no artists', () => {
    expect(artistList(null)).toEqual([]);
    expect(artistList(undefined)).toEqual([]);
  });
});

describe('albumKey', () => {
  it('prefers the Spotify id when there is one', () => {
    expect(albumKey({ spotifyId: '4aawyAB9vmqN3uQ7FjRGTy', title: 'Global Warming', artist: ['Pitbull'] })).toBe(
      'spotify:4aawyAB9vmqN3uQ7FjRGTy',
    );
  });

  it('keys a manual entry on the first artist and the title', () => {
    expect(albumKey({ title: 'Kid A', artist: ['Radiohead'] })).toBe('manual:radiohead|kid-a');
  });

  it('ignores accents, case and punctuation so the same record keys once', () => {
    expect(albumKey({ title: 'Lemonade!', artist: ['Beyoncé'] })).toBe(albumKey({ title: 'lemonade', artist: ['Beyonce'] }));
  });

  it('ignores a featured artist added by a reissue', () => {
    const original = albumKey({ title: 'Blonde', artist: ['Frank Ocean'] });
    const reissue = albumKey({ title: 'Blonde', artist: ['Frank Ocean', 'Andre 3000'] });
    expect(reissue).toBe(original);
  });

  it('falls back to unknown rather than an empty key', () => {
    expect(albumKey({ title: 'Untitled' })).toBe('manual:unknown|untitled');
  });
});

describe('key helpers', () => {
  it('reads a Spotify id back out', () => {
    expect(spotifyIdFromKey('spotify:abc123')).toBe('abc123');
    expect(spotifyIdFromKey('manual:radiohead|kid-a')).toBeNull();
    expect(isSpotifyKey('spotify:abc123')).toBe(true);
  });
});
