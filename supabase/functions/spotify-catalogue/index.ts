// Resolved by Deno's registry in the Edge Runtime, not the app's Node resolver.
// eslint-disable-next-line import/no-unresolved
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { catalogueUrl } from './path.ts';

const AUTH_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
const ORIGINS = new Set(['https://sonar-tracker.web.app', 'https://sonar-tracker.firebaseapp.com']);
let cached: { token: string; until: number } | null = null;
let pending: Promise<string> | null = null;

async function appToken(): Promise<string> {
  if (cached && cached.until > Date.now()) return cached.token;
  if (pending) return pending;
  pending = (async () => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}` },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) throw new Error('Catalogue authentication unavailable');
    const data = await response.json();
    if (typeof data.access_token !== 'string' || !Number.isFinite(data.expires_in)) throw new Error('Invalid token response');
    cached = { token: data.access_token, until: Date.now() + Math.max(0, data.expires_in - 60) * 1000 };
    return cached.token;
  })();
  try { return await pending; } finally { pending = null; }
}

async function smallJson(req: Request): Promise<unknown> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 4096) { await reader.cancel(); throw new Error('Body too large'); }
    chunks.push(value);
  }
  const data = new Uint8Array(bytes);
  let at = 0;
  for (const chunk of chunks) { data.set(chunk, at); at += chunk.length; }
  return JSON.parse(new TextDecoder().decode(data));
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (origin && ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !ORIGINS.has(origin)) return json(403, { error: 'Origin not allowed' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json(405, { error: 'Use POST' });
  const authorization = req.headers.get('authorization');
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) return json(401, { error: 'Sign in to search Spotify' });
  try {
    const auth = await fetch(`${AUTH_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: authorization },
      redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!auth.ok) return json(401, { error: 'Sign in to search Spotify' });
    const user = await auth.json();
    if (!user.id || user.is_anonymous) return json(401, { error: 'Sign in to search Spotify' });
    let body;
    try { body = await smallJson(req); } catch { return json(400, { error: 'Invalid catalogue request' }); }
    const url = catalogueUrl(body && typeof body === 'object' && 'path' in body ? body.path : null);
    if (!url) return json(400, { error: 'Unsupported catalogue request' });
    if (!CLIENT_ID || !CLIENT_SECRET) return json(503, { error: 'Spotify search is temporarily unavailable' });
    const get = async () => fetch(url, { headers: { Authorization: `Bearer ${await appToken()}` },
      redirect: 'error', signal: AbortSignal.timeout(8000) });
    let response = await get();
    if (response.status === 401) { cached = null; response = await get(); }
    if (!response.ok) {
      if (response.status === 429) {
        const wait = response.headers.get('retry-after');
        if (wait && /^\d+$/.test(wait)) headers['Retry-After'] = wait;
        return json(429, { error: 'Spotify is busy — try again shortly' });
      }
      return json(response.status === 404 ? 404 : 502, { error: 'Spotify catalogue request failed' });
    }
    return json(200, await response.json());
  } catch {
    // Never log credentials, bearer headers, token responses, queries or user data.
    return json(502, { error: 'Spotify search is temporarily unavailable' });
  }
});
