import {
  albumKey,
  artistKey,
  artistList,
  isSpotifyKey,
  songKey,
  spotifyIdFromKey,
  subjectIdFromKey,
  subjectOf,
} from './albumKey';

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

describe('subject keys', () => {
  it('namespaces a song and an artist away from a release', () => {
    expect(songKey('2JiDi0qAXsPwhPqA2qaKGt')).toBe('spotify:song:2JiDi0qAXsPwhPqA2qaKGt');
    expect(artistKey('1dfeR4HaWDbWqFHLkxsg1d')).toBe('spotify:artist:1dfeR4HaWDbWqFHLkxsg1d');
  });

  it('reads the subject back off a key', () => {
    expect(subjectOf('spotify:song:abc')).toBe('song');
    expect(subjectOf('spotify:artist:abc')).toBe('artist');
    expect(subjectOf('spotify:abc')).toBe('album');
    expect(subjectOf('manual:queen|a-night-at-the-opera')).toBe('album');
  });

  it('refuses to hand a song id to an album lookup', () => {
    expect(spotifyIdFromKey('spotify:song:abc')).toBeNull();
    expect(spotifyIdFromKey('spotify:artist:abc')).toBeNull();
    expect(spotifyIdFromKey('spotify:abc')).toBe('abc');
  });

  it('reads the id of any subject', () => {
    expect(subjectIdFromKey('spotify:song:abc')).toBe('abc');
    expect(subjectIdFromKey('spotify:artist:abc')).toBe('abc');
    expect(subjectIdFromKey('spotify:abc')).toBe('abc');
    expect(subjectIdFromKey('manual:queen|kind-of-blue')).toBeNull();
  });
});
