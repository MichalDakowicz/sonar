/**
 * One-off import of the old Sonar's Firebase Realtime Database into the shared
 * Supabase project.
 *
 * The legacy app stored everything under `users/<firebaseUid>/…`. Supabase keys
 * on the auth user id instead, and the two have nothing to do with each other,
 * so the mapping has to be given explicitly — there is no way to derive it, and
 * guessing would file someone else's records under your account.
 *
 * Usage (from the repo root, with .env holding SUPABASE_SERVICE_ROLE_KEY):
 *
 *   # 1. See what would happen. Nothing is written.
 *   npm run migrate:firebase -- --map <firebaseUid>=<supabaseUserId>
 *
 *   # 2. Do it.
 *   npm run migrate:firebase -- --map <firebaseUid>=<supabaseUserId> --commit
 *
 * Options:
 *   --map a=b[,c=d]   firebase uid -> supabase user id (repeatable, required)
 *   --file <path>     read a JSON export instead of the live database
 *   --commit          actually write
 *
 * With no --file it pulls the database over REST. That needs the database to be
 * readable — either temporarily open rules or, more sensibly, export a JSON
 * backup from the Firebase console and pass --file.
 *
 * Idempotent: albums and ratings are keyed by (user, album_key) and upserted,
 * so re-running imports nothing new. Spins are content-keyed on
 * (album_key, played_at) and skipped if already present.
 */

import { readFileSync } from 'node:fs';

import { createClient } from '@supabase/supabase-js';

import { albumKey, artistList } from '../src/lib/albumKey';
import { normalizeStatus } from '../src/lib/albumStatus';
import { normalizeFormats } from '../src/lib/formats';

type LegacyAlbum = Record<string, unknown>;
type LegacyExport = {
  users?: Record<string, { albums?: Record<string, LegacyAlbum>; history?: Record<string, LegacyAlbum> }>;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIREBASE_DB = process.env.FIREBASE_DATABASE_URL;

function parseArgs(argv: string[]) {
  const map = new Map<string, string>();
  let file: string | undefined;
  let commit = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--commit') commit = true;
    else if (arg === '--file') file = argv[++i];
    else if (arg === '--map') {
      for (const pair of (argv[++i] ?? '').split(',')) {
        const [from, to] = pair.split('=');
        if (from && to) map.set(from.trim(), to.trim());
      }
    }
  }

  return { map, file, commit };
}

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Firebase wrote epoch millis; Postgres wants ISO. */
function iso(value: unknown): string | null {
  if (typeof value === 'number') return new Date(value).toISOString();
  const text = str(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

/** A bare `YYYY-MM-DD`, which is all a Postgres date column accepts. */
function dateOnly(value: unknown): string | null {
  const text = str(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function albumRow(userId: string, legacy: LegacyAlbum) {
  const title = str(legacy.title);
  if (!title) return null;

  const artist = artistList((legacy.artist as string[] | string | null) ?? null);
  const spotifyId = str(legacy.spotifyId) || null;

  return {
    user_id: userId,
    spotify_id: spotifyId,
    album_key: albumKey({ spotifyId, title, artist }),
    title,
    artist,
    cover_url: str(legacy.coverUrl) || null,
    release_date: str(legacy.releaseDate) || null,
    release_date_precision: str(legacy.releaseDatePrecision) || null,
    total_tracks: num(legacy.totalTracks),
    genres: Array.isArray(legacy.genres) ? legacy.genres.map(String) : [],
    url: str(legacy.url) || str(legacy.albumUrl) || null,
    // Legacy key was `format`, sometimes a bare string.
    formats: normalizeFormats(legacy.formats ?? legacy.format),
    status: normalizeStatus(legacy.status),
    notes: str(legacy.notes) || null,
    favorite_tracks: str(legacy.favoriteTracks) || null,
    acquisition_date: dateOnly(legacy.acquisitionDate),
    store_name: str(legacy.storeName) || null,
    price_paid: num(legacy.pricePaid),
    catalog_number: str(legacy.catalogNumber) || null,
    custom_order: num(legacy.customOrder),
    last_listened_at: iso(legacy.lastListened ?? legacy.lastListenedAt),
    added_at: iso(legacy.addedAt) ?? new Date().toISOString(),
  };
}

/**
 * The legacy app had one `rating` number and no facets, so it becomes the
 * overall score. A rating is worth carrying over even when the album is not:
 * the table is keyed by release, not by ownership.
 */
function ratingRow(userId: string, legacy: LegacyAlbum) {
  const overall = num(legacy.rating);
  const title = str(legacy.title);
  if (!overall || overall <= 0 || !title) return null;

  const artist = artistList((legacy.artist as string[] | string | null) ?? null);
  const spotifyId = str(legacy.spotifyId) || null;

  return {
    user_id: userId,
    album_key: albumKey({ spotifyId, title, artist }),
    spotify_id: spotifyId,
    title,
    artist,
    cover_url: str(legacy.coverUrl) || null,
    release_date: str(legacy.releaseDate) || null,
    ratings: { overall },
    review: str(legacy.notes) || null,
  };
}

async function loadExport(file: string | undefined): Promise<LegacyExport> {
  if (file) return JSON.parse(readFileSync(file, 'utf8')) as LegacyExport;
  if (!FIREBASE_DB) fail('No --file given and FIREBASE_DATABASE_URL is not set.');

  const response = await fetch(`${FIREBASE_DB}/.json`);
  if (!response.ok) {
    fail(
      `Firebase read failed (${response.status}). Export a JSON backup from the console and pass --file instead.`,
    );
  }
  return (await response.json()) as LegacyExport;
}

async function main() {
  const { map, file, commit } = parseArgs(process.argv.slice(2));

  if (!SUPABASE_URL || !SERVICE_ROLE) fail('EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.');
  if (map.size === 0) {
    fail('Give at least one --map <firebaseUid>=<supabaseUserId>. Find the Supabase id under Authentication → Users.');
  }

  // Service role, so this bypasses RLS — it is writing rows on behalf of a user
  // who is not signed in here. Nothing else in the project uses this key.
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const data = await loadExport(file);

  for (const [firebaseUid, supabaseUserId] of map) {
    const legacyUser = data.users?.[firebaseUid];
    if (!legacyUser) {
      console.warn(`! no data under users/${firebaseUid} — skipped`);
      continue;
    }

    const legacyAlbums = Object.values(legacyUser.albums ?? {});
    const albums = legacyAlbums.map((entry) => albumRow(supabaseUserId, entry)).filter((row) => row !== null);
    const ratings = legacyAlbums.map((entry) => ratingRow(supabaseUserId, entry)).filter((row) => row !== null);

    // The legacy history row points at a firebase album key, which means
    // nothing here; the spin is re-attached by release key via its title and
    // artist, and left unattached when the album did not come across.
    const keyByLegacyId = new Map<string, string>();
    for (const [legacyId, entry] of Object.entries(legacyUser.albums ?? {})) {
      const row = albumRow(supabaseUserId, entry);
      if (row) keyByLegacyId.set(legacyId, row.album_key);
    }

    const spins = Object.values(legacyUser.history ?? {})
      .map((entry) => {
        const playedAt = iso(entry.timestamp ?? entry.playedAt);
        const title = str(entry.title);
        if (!playedAt || !title) return null;
        return {
          user_id: supabaseUserId,
          album_key: keyByLegacyId.get(str(entry.albumId)) ?? null,
          title,
          artist: artistList((entry.artist as string[] | string | null) ?? null),
          cover_url: str(entry.coverUrl) || null,
          played_at: playedAt,
        };
      })
      .filter((row) => row !== null);

    console.log(
      `${firebaseUid} -> ${supabaseUserId}: ${albums.length} albums, ${ratings.length} ratings, ${spins.length} spins`,
    );

    if (!commit) continue;

    // Albums first: the spin rows are matched back to them afterwards, and a
    // spin whose album is missing is still worth keeping as history.
    const { error: albumError } = await supabase.from('albums').upsert(albums, { onConflict: 'user_id,album_key' });
    if (albumError) fail(`Album insert failed: ${albumError.message}`);

    if (ratings.length > 0) {
      const { error: ratingError } = await supabase
        .from('album_ratings')
        .upsert(ratings, { onConflict: 'user_id,album_key' });
      if (ratingError) fail(`Rating insert failed: ${ratingError.message}`);
    }

    // Re-read the inserted albums so each spin can carry a real album_id.
    const { data: inserted, error: readError } = await supabase
      .from('albums')
      .select('id, album_key')
      .eq('user_id', supabaseUserId);
    if (readError) fail(`Could not read back albums: ${readError.message}`);
    const idByKey = new Map((inserted ?? []).map((row) => [row.album_key as string, row.id as string]));

    // album_spins has no natural key, so a re-run would duplicate the log
    // without this: skip anything already stored at the same instant.
    const { data: existing } = await supabase.from('album_spins').select('played_at').eq('user_id', supabaseUserId);
    const seen = new Set((existing ?? []).map((row) => row.played_at as string));
    const fresh = spins
      .filter((spin) => !seen.has(spin.played_at))
      .map((spin) => ({ ...spin, album_id: spin.album_key ? idByKey.get(spin.album_key) ?? null : null }));

    if (fresh.length > 0) {
      const { error: spinError } = await supabase.from('album_spins').insert(fresh);
      if (spinError) fail(`Spin insert failed: ${spinError.message}`);
    }

    console.log(`  wrote ${albums.length} albums, ${ratings.length} ratings, ${fresh.length} spins`);
  }

  if (!commit) console.log('\nDry run — nothing was written. Re-run with --commit.');
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
