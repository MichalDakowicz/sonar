import { ratingHref } from '@/lib/ratingHref';

describe('ratingHref', () => {
  it('sends a release to the album screen', () => {
    expect(ratingHref('spotify:1To7kv722A8SpZF789MZy7')).toEqual({
      pathname: '/release/[albumKey]',
      params: { albumKey: 'spotify:1To7kv722A8SpZF789MZy7' },
    });
  });

  it('sends a manual release there too', () => {
    expect(ratingHref('manual:queen|a-night-at-the-opera').pathname).toBe('/release/[albumKey]');
  });

  it('sends a song and an artist to the rate screen', () => {
    expect(ratingHref('spotify:song:abc')).toEqual({
      pathname: '/rate/[subjectKey]',
      params: { subjectKey: 'spotify:song:abc' },
    });
    expect(ratingHref('spotify:artist:abc').pathname).toBe('/rate/[subjectKey]');
  });
});
