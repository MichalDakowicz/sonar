import { searchAlbums, spotifyGet } from './spotify';
import { supabase } from './supabase';

jest.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke: jest.fn() } } }));
const invoke = supabase.functions.invoke as jest.Mock;
beforeEach(() => invoke.mockReset());
it('uses the authenticated function and returns catalogue data', async () => {
  invoke.mockResolvedValue({ data: { id: 'release' }, error: null });
  expect(await spotifyGet('/albums/release')).toEqual({ id: 'release' });
  expect(invoke).toHaveBeenCalledWith('spotify-catalogue', { body: { path: '/albums/release' } });
});
it('reports function failures without returning raw upstream details', async () => {
  invoke.mockResolvedValue({ data: null, error: new Error('private upstream detail') });
  await expect(spotifyGet('/albums/release')).rejects.toThrow('Spotify search is unavailable');
});
it('bounds search to the development-mode limit', async () => {
  invoke.mockResolvedValue({ data: { albums: { items: [] } }, error: null });
  await searchAlbums('a record', 50);
  expect(invoke.mock.calls[0][1].body.path).toContain('limit=10');
});
