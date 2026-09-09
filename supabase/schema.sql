-- Sonar — schema, RLS and realtime, on the SAME Supabase project as Radar.
--
-- WHY ONE PROJECT: a free Supabase plan is one project, and the two apps are
-- the same person's account either way. Everything about *who you are* is
-- shared and is NOT re-created here — public.profiles, public.friendships,
-- public.friend_requests, public.user_settings, private.can_view() and the
-- accept/decline/remove friend RPCs all come from Radar's supabase/schema.sql.
-- Run that file first (it is idempotent); this one only adds what music needs.
--
-- WHY SEPARATE TABLES rather than reusing public.movies/public.activity: an
-- album is not a shaped-down film (formats, pressings, spins), and Radar's
-- client selects `*` from those tables and normalizes every row as a title.
-- Album rows landing there would render as broken movies in the other app.
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query → paste the whole
-- file → Run. Idempotent: every statement is `if not exists`, `create or
-- replace`, or a guarded do-block, so re-running only applies what is missing.
-- It never drops a table, a column or a row.

-- ============================================================================
-- PREREQUISITE CHECK — fail loudly rather than half-creating a broken schema.
-- ============================================================================

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'Run Radar''s supabase/schema.sql first: public.profiles is missing (Sonar shares it).';
  end if;
  if to_regprocedure('private.can_view(uuid)') is null then
    raise exception 'Run Radar''s supabase/schema.sql first: private.can_view() is missing (Sonar shares it).';
  end if;
end $$;

-- ============================================================================
-- SCHEMA
-- ============================================================================

-- Formats and shelf status are free text with a CHECK rather than enums: the
-- lists live in the client (lib/formats.ts, lib/albumStatus.ts) and gain
-- entries faster than a Postgres type should be altered.

create table if not exists public.albums (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  spotify_id    text,
  -- Identity of the *release*, not of this row: 'spotify:<id>' when Spotify
  -- knows it, else 'manual:<artist>|<title>' (lib/albumKey.ts). It is what
  -- joins an owned album to a rating, and what lets a rating exist with no
  -- album row behind it at all.
  album_key     text not null,
  title         text not null,
  -- string[] — a release can credit several artists and the collection filters
  -- on each of them, so this is a list, never a joined string.
  artist        jsonb not null default '[]',
  cover_url     text,
  -- Text, not date: Spotify dates come at year / month / day precision and
  -- '1969' must survive a round trip (release_date_precision says which).
  release_date  text,
  release_date_precision text,
  total_tracks  int,
  genres        jsonb not null default '[]',
  url           text,
  -- Physical + digital copies owned of this one release.
  formats       text[] not null default '{}',
  status        text not null default 'Collection'
                  check (status in ('Collection','Wishlist','Pre-order')),
  notes         text,
  favorite_tracks text,
  acquisition_date date,
  store_name    text,
  price_paid    numeric,
  catalog_number text,
  -- Manual shelf order (drag to reorder). Sparse doubles, so a move only
  -- rewrites the row that moved.
  custom_order  double precision,
  -- Derived mirror of the newest public.album_spins row for this album. Kept
  -- denormalized because a friend's shelf reads albums alone, without pulling
  -- the other person's whole spin log (written by hooks/useSpins).
  last_listened_at timestamptz,
  added_at      timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists albums_user_id_idx            on public.albums (user_id);
create index if not exists albums_user_id_status_idx     on public.albums (user_id, status);
create index if not exists albums_user_id_added_at_idx   on public.albums (user_id, added_at desc);

-- UNIQUE, not just an index: one row per release per person. Owning the same
-- record on vinyl and CD is one row with two `formats`, never two rows — and
-- the uniqueness is also what `on conflict (user_id, album_key)` needs, which
-- is how the importer and the migration script avoid doubling a collection on a
-- second run.
create unique index if not exists albums_user_id_album_key_key on public.albums (user_id, album_key);

-- One row per listen. The log is the source of truth; albums.last_listened_at
-- is its mirror. album_key is copied in so a spin survives the album row being
-- deleted from the collection (you still listened to it).
create table if not exists public.album_spins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  album_id   uuid references public.albums(id) on delete set null,
  album_key  text,
  title      text not null,
  artist     jsonb not null default '[]',
  cover_url  text,
  played_at  timestamptz not null default now()
);

create index if not exists album_spins_user_id_played_at_idx on public.album_spins (user_id, played_at desc);
create index if not exists album_spins_album_id_idx          on public.album_spins (album_id);

-- Ratings hang off the *release*, not off ownership: rating something you do
-- not own (a friend's record, a search result, an album you only streamed) is
-- the point, so this table has no FK to public.albums. An owned album finds its
-- rating by album_key, and keeps it if the album is later removed and re-added.
--
-- `ratings` is jsonb in the same shape Radar uses for films
-- ({production,vocals,lyrics,replay,overall}), so the scoring rule
-- (lib/personalScore.ts) is literally the same function in both apps.
create table if not exists public.album_ratings (
  user_id    uuid not null references auth.users(id) on delete cascade,
  album_key  text not null,
  spotify_id text,
  -- Snapshot of what was rated, for the same reason profiles.favorites is a
  -- snapshot: the rating has to render on its own, with no album row to join.
  title      text not null,
  artist     jsonb not null default '[]',
  cover_url  text,
  release_date text,
  ratings    jsonb not null default '{}',
  review     text,
  -- 'album' | 'song' | 'artist' — what album_key names. See the migration below
  -- for why it exists and why it defaults.
  subject_type text not null default 'album'
    check (subject_type in ('album', 'song', 'artist')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, album_key)
);

create index if not exists album_ratings_user_id_idx on public.album_ratings (user_id);
-- The ratings-distribution curve and the "rating" sort read the overall score.
create index if not exists album_ratings_user_id_overall_idx
  on public.album_ratings (user_id, ((ratings->>'overall')::numeric));

-- Sonar's own activity log, mirroring public.activity's shape and purpose.
create table if not exists public.album_activity (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  album_id    uuid references public.albums(id) on delete set null,
  album_key   text,
  album_title text not null,
  type        text not null,
  details     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists album_activity_user_id_created_at_idx
  on public.album_activity (user_id, created_at desc);

-- Reactions and comments on an album activity row, same contract as Radar's:
-- kind is a short code, not the emoji glyph, so the CHECK is not a unicode
-- normalisation puzzle (the client maps code -> glyph in lib/socialFeed.ts).
create table if not exists public.album_activity_reactions (
  activity_id uuid not null references public.album_activity(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('fire','eyes','heart')),
  created_at  timestamptz not null default now(),
  primary key (activity_id, user_id, kind)
);
create index if not exists album_activity_reactions_activity_id_idx
  on public.album_activity_reactions (activity_id);

create table if not exists public.album_activity_comments (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.album_activity(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null check (length(btrim(body)) between 1 and 500),
  created_at  timestamptz not null default now()
);
create index if not exists album_activity_comments_activity_id_created_at_idx
  on public.album_activity_comments (activity_id, created_at);

-- ============================================================================
-- COLUMN AND INDEX MIGRATIONS — for a database created by an earlier run of
-- this file. The CREATE TABLEs above are skipped entirely once the tables
-- exist, so anything added or corrected afterwards has to be applied here too.
-- ============================================================================

-- Ratings started out being only about releases. A song and an artist are
-- separate opinions from the record a song sits on, so both became rateable in
-- their own right, keyed `spotify:song:<id>` / `spotify:artist:<id>`
-- (src/lib/albumKey.ts). The column is what lets the collection's stats stay
-- about records while the ratings board shows everything.
--
-- Defaulted, so every row written before this is a release, which is what they
-- all were.
alter table public.album_ratings
  add column if not exists subject_type text not null default 'album';

-- ADD CONSTRAINT has no `if not exists`; swallowing duplicate_object is the
-- idempotent form. Nothing is dropped, so a re-run on a live database is a
-- no-op rather than a window with the check missing.
do $$ begin
  alter table public.album_ratings
    add constraint album_ratings_subject_type_check
    check (subject_type in ('album', 'song', 'artist'));
exception
  when duplicate_object then null;
end $$;

-- (user_id, album_key) shipped as a plain index and had to become UNIQUE: an
-- upsert cannot name a conflict target that is not a constraint, so
-- `on conflict (user_id, album_key)` failed with "there is no unique or
-- exclusion constraint matching the ON CONFLICT specification" and the JSON
-- import could not run at all.
--
-- The unique index above is created with `if not exists`, which matches on the
-- name — so the old non-unique index has to go by its own name or the pair
-- would both exist, with only the redundant one being consulted. Dropping an
-- index destroys no rows.
drop index if exists public.albums_user_id_album_key_idx;

-- ============================================================================
-- RLS — the same two-policy shape Radar uses: owner writes, visible reads.
-- private.can_view(target) is Radar's and reads user_settings.friends_visibility,
-- so one privacy switch governs both apps. That is deliberate: it is one
-- profile, and "friends only" meaning two different things in two apps would be
-- a way to leak a shelf you thought was closed.
-- ============================================================================

create or replace function private.can_view_album_activity(target uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.album_activity a
    where a.id = target and private.can_view(a.user_id)
  );
$$;
revoke all on function private.can_view_album_activity(uuid) from public;
grant execute on function private.can_view_album_activity(uuid) to authenticated, anon;

alter table public.albums                    enable row level security;
alter table public.album_spins               enable row level security;
alter table public.album_ratings             enable row level security;
alter table public.album_activity            enable row level security;
alter table public.album_activity_reactions  enable row level security;
alter table public.album_activity_comments   enable row level security;

-- CREATE POLICY has no `if not exists`, so each is dropped and re-created. The
-- pair runs inside the SQL Editor's single transaction — no unprotected window.
drop policy if exists albums_owner_all on public.albums;
create policy albums_owner_all on public.albums for all
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists albums_visible_read on public.albums;
create policy albums_visible_read on public.albums for select
  to anon, authenticated using (private.can_view(user_id));

drop policy if exists album_spins_owner_all on public.album_spins;
create policy album_spins_owner_all on public.album_spins for all
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists album_spins_visible_read on public.album_spins;
create policy album_spins_visible_read on public.album_spins for select
  to anon, authenticated using (private.can_view(user_id));

drop policy if exists album_ratings_owner_all on public.album_ratings;
create policy album_ratings_owner_all on public.album_ratings for all
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists album_ratings_visible_read on public.album_ratings;
create policy album_ratings_visible_read on public.album_ratings for select
  to anon, authenticated using (private.can_view(user_id));

drop policy if exists album_activity_visible_read on public.album_activity;
create policy album_activity_visible_read on public.album_activity for select
  to anon, authenticated using (private.can_view(user_id));
drop policy if exists album_activity_owner_write on public.album_activity;
create policy album_activity_owner_write on public.album_activity for insert
  to authenticated with check ((select auth.uid()) = user_id);

-- React/comment on anything you may see; take back only your own. No update
-- policy on either: a reaction toggles by delete, a comment is post-or-delete.
drop policy if exists album_reactions_visible_read on public.album_activity_reactions;
create policy album_reactions_visible_read on public.album_activity_reactions for select
  to authenticated using (private.can_view_album_activity(activity_id));
drop policy if exists album_reactions_owner_write on public.album_activity_reactions;
create policy album_reactions_owner_write on public.album_activity_reactions for insert
  to authenticated with check (
    (select auth.uid()) = user_id and private.can_view_album_activity(activity_id)
  );
drop policy if exists album_reactions_owner_delete on public.album_activity_reactions;
create policy album_reactions_owner_delete on public.album_activity_reactions for delete
  to authenticated using ((select auth.uid()) = user_id);

drop policy if exists album_comments_visible_read on public.album_activity_comments;
create policy album_comments_visible_read on public.album_activity_comments for select
  to authenticated using (private.can_view_album_activity(activity_id));
drop policy if exists album_comments_owner_write on public.album_activity_comments;
create policy album_comments_owner_write on public.album_activity_comments for insert
  to authenticated with check (
    (select auth.uid()) = user_id and private.can_view_album_activity(activity_id)
  );
drop policy if exists album_comments_owner_delete on public.album_activity_comments;
create policy album_comments_owner_delete on public.album_activity_comments for delete
  to authenticated using ((select auth.uid()) = user_id);

-- ============================================================================
-- REALTIME — the collection, the spin log and the feed all live-update.
-- ============================================================================

do $$
declare
  t text;
begin
  foreach t in array array['albums','album_spins','album_ratings','album_activity',
                           'album_activity_reactions','album_activity_comments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
