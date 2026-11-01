/** Build a catalogue-only Spotify URL. Never accept a caller-supplied host. */
export function catalogueUrl(path: unknown): string | null {
  if (typeof path !== 'string' || path.length > 2048 || !path.startsWith('/')) return null;
  const [route, query = '', extra] = path.split('?');
  if (extra !== undefined || /[%\\#\s]/.test(route) || query.includes('#')) return null;
  const search = route === '/search';
  const tracks = /^\/albums\/[A-Za-z0-9]{22}\/tracks$/.test(route);
  const releases = /^\/artists\/[A-Za-z0-9]{22}\/albums$/.test(route);
  const detail = /^\/(albums|tracks|artists)\/[A-Za-z0-9]{22}$/.test(route);
  if (!search && !tracks && !releases && !detail) return null;
  const params = new URLSearchParams(query);
  const allowed = search ? ['q', 'type', 'limit', 'offset']
    : releases ? ['include_groups', 'limit', 'offset'] : tracks ? ['limit', 'offset'] : [];
  const seen = new Set<string>();
  for (const [key, value] of params) {
    if (!allowed.includes(key) || seen.has(key)) return null;
    seen.add(key);
    if (key === 'limit' && (!/^\d+$/.test(value) || +value < 1 || +value > (search ? 10 : 50))) return null;
    if (key === 'offset' && (!/^\d+$/.test(value) || +value > 1000)) return null;
  }
  if (search) {
    const q = params.get('q')?.trim();
    const types = params.get('type')?.split(',') ?? [];
    if (!q || q.length > 300 || /[\x00-\x1f]/.test(q)) return null;
    if (!types.length || new Set(types).size !== types.length || types.some(t => !['album', 'track', 'artist'].includes(t))) return null;
    params.set('limit', params.get('limit') ?? '10');
  }
  if (releases && !['album', 'single'].includes(params.get('include_groups') ?? '')) return null;
  const tail = params.toString();
  return `https://api.spotify.com/v1${route}${tail ? `?${tail}` : ''}`;
}
