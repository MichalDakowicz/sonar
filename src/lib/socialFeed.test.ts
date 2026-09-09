import { activityVerb } from '@/lib/socialFeed';

const rated = (details: Record<string, unknown>) => activityVerb({ type: 'rating_changed', details });

describe('activityVerb for a rating', () => {
  it('says "it" for a release, which is what every old row is', () => {
    expect(rated({ rating: 4.5 })).toBe('rated it 4.5');
    expect(rated({ rating: 4.5, subject: 'album' })).toBe('rated it 4.5');
  });

  it('names the subject when it is not a release', () => {
    expect(rated({ rating: 5, subject: 'song' })).toBe('rated the song 5');
    expect(rated({ rating: 3, subject: 'artist' })).toBe('rated the artist 3');
  });

  it('drops the score when the payload has none', () => {
    expect(rated({ subject: 'song' })).toBe('rated the song');
    expect(rated({})).toBe('rated it');
  });
});
