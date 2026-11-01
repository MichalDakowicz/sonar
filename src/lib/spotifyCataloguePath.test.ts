import { catalogueUrl } from '../../supabase/functions/spotify-catalogue/path';

const id = 'a'.repeat(22);
describe('Spotify catalogue boundary', () => {
  it.each([`/albums/${id}`, `/tracks/${id}`, `/artists/${id}`, `/albums/${id}/tracks?limit=50`,
    `/artists/${id}/albums?include_groups=single&limit=50`, '/search?q=hello&type=album,track,artist&limit=10'])('accepts %s', path => {
    expect(catalogueUrl(path)).toMatch(/^https:\/\/api.spotify.com\/v1\//);
  });
  it.each(['https://evil.example', '//evil.example/path', '/me', '/api/token', `/albums/${id}/../me`,
    `/albums/%2e%2e`, `/albums/${id}?redirect=https://evil.example`, '/search?q=x&type=album&limit=50',
    '/search?q=x&type=playlist', '/search?q=x&type=album&type=artist', '/search?q=x&type=album&limit=0',
    '/search?q=x&type=album&offset=1001', '/search?q=x&type=album#fragment', '/search?q=&type=album',
    `/artists/${id}/albums?include_groups=unknown`, `/albums/${id}\\evil`, null])('rejects %s', path => {
    expect(catalogueUrl(path)).toBeNull();
  });
});
