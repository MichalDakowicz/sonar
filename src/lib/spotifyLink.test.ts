import { extractUrl, isSpotifyShortLink, parseSpotifyRef } from '@/lib/spotifyLink';

describe('parseSpotifyRef', () => {
  it('reads an album link', () => {
    expect(parseSpotifyRef('https://open.spotify.com/album/1To7kv722A8SpZF789MZy7')).toEqual({
      type: 'album',
      id: '1To7kv722A8SpZF789MZy7',
    });
  });

  it('reads the link out of the sentence the share sheet builds', () => {
    const shared = 'Bohemian Rhapsody by Queen\nhttps://open.spotify.com/track/3z8h0TU7ReDPLIbEnYhWZb?si=abc123';
    expect(parseSpotifyRef(shared)).toEqual({ type: 'track', id: '3z8h0TU7ReDPLIbEnYhWZb' });
  });

  it('ignores a locale segment', () => {
    expect(parseSpotifyRef('https://open.spotify.com/intl-pl/artist/1dfeR4HaWDbWqFHLkxsg1d')).toEqual({
      type: 'artist',
      id: '1dfeR4HaWDbWqFHLkxsg1d',
    });
  });

  it('reads a spotify: URI', () => {
    expect(parseSpotifyRef('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M')).toEqual({
      type: 'playlist',
      id: '37i9dQZF1DXcBWIGoYBM5M',
    });
  });

  it('treats a bare id as an album, the way the paste path always did', () => {
    expect(parseSpotifyRef('1To7kv722A8SpZF789MZy7')).toEqual({ type: 'album', id: '1To7kv722A8SpZF789MZy7' });
  });

  it('does not treat a short word as an id', () => {
    expect(parseSpotifyRef('queen')).toBeNull();
  });

  it('returns null for text with no link in it', () => {
    expect(parseSpotifyRef('a night at the opera')).toBeNull();
    expect(parseSpotifyRef('')).toBeNull();
    expect(parseSpotifyRef(null)).toBeNull();
  });
});

describe('extractUrl', () => {
  it('pulls the url out of shared text', () => {
    expect(extractUrl('Check this out https://spotify.link/aBcDeF and tell me')).toBe('https://spotify.link/aBcDeF');
  });

  it('is null when there is no url', () => {
    expect(extractUrl('no link here')).toBeNull();
  });
});

describe('isSpotifyShortLink', () => {
  it('spots the shortened hosts', () => {
    expect(isSpotifyShortLink('https://spotify.link/aBcDeF')).toBe(true);
    expect(isSpotifyShortLink('https://spotify.app.link/aBcDeF')).toBe(true);
  });

  it('leaves the canonical host alone', () => {
    expect(isSpotifyShortLink('https://open.spotify.com/album/1To7kv722A8SpZF789MZy7')).toBe(false);
    expect(isSpotifyShortLink(null)).toBe(false);
  });
});
