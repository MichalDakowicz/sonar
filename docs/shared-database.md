# One database, two apps

Sonar and Radar run on the **same Supabase project**. Not a copy, not a sync — the same
rows. This is a deliberate constraint: the free plan is one project, and both apps belong
to the same person, so the alternative was two accounts and two friend lists for one
human.

The cost is a coupling that has to be respected. This file is the contract.

## What is shared

| Table / function | Owner | Sonar's use |
| --- | --- | --- |
| `public.profiles` | Radar | Read; writes username / display name / avatar. **Never** touches `favorites`. |
| `public.friendships` | Radar | Read; writes via the RPCs below. |
| `public.friend_requests` | Radar | Read; inserts its own requests. |
| `public.user_settings` | Radar | Reads and writes **only** `friends_visibility` and `theme`. |
| `private.can_view(uuid)` | Radar | Every Sonar read policy calls it. |
| `accept_friend_request`, `decline_friend_request`, `remove_friend`, `can_view_user` | Radar | Called as-is. |

Consequences worth stating plainly, because they are user-visible:

- **One identity.** Renaming yourself or changing your avatar in Sonar renames you in
  Radar. The login is the same login.
- **One friend list.** Accepting a request in either app makes you friends in both. A
  friend you remove is removed from both.
- **One privacy switch.** `friends_visibility` gates the film shelf and the record shelf
  together. "Friends only" meaning two different things in two apps would be a way to
  leak a shelf you thought you had closed, so it deliberately does not.

## What is Sonar's own

`albums`, `album_spins`, `album_ratings`, `album_activity`,
`album_activity_reactions`, `album_activity_comments`. All created by
`supabase/schema.sql`, all RLS'd with the same owner-writes / visible-reads shape Radar
uses.

### Why not reuse `public.movies` and `public.activity`

An album is not a shaped-down film — it has formats, a pressing, a price, a spin log —
and more decisively, Radar's client does `select *` on those tables and normalizes every
row through `normalizeMovie`. Album rows landing there would render as broken movies in
the other app. Separate tables cost one extra query and keep both clients honest.

### Why ratings are their own table

`album_ratings` is keyed `(user_id, album_key)` and has **no foreign key** to `albums`.
That is what makes the headline feature work: you can rate a record you do not own — a
friend's copy, a search result, something you only ever streamed — and the score survives
removing the album from your shelf and adding it back later.

`album_key` is the identity of whatever is being rated (`src/lib/albumKey.ts`):

| Key | What it names |
| --- | --- |
| `spotify:<id>` | a release Spotify knows |
| `manual:<slug(first artist)>|<slug(title)>` | a hand-typed release |
| `spotify:song:<id>` | one song |
| `spotify:artist:<id>` | an artist |

`subject_type` (`album` / `song` / `artist`) says which, and is the reason the collection's
numbers stayed honest when songs and artists became rateable: the shelf stats, the top four
and the profile curve read releases only, while the Ratings board shows every subject behind
its own filter. Songs and artists are **rate-only** — there is no shelf row, format or spin
log behind either, which is what the FK-less table already allowed for.

The column is defaulted rather than backfilled, so every row written before it existed reads
as a release, which is what they all were. `normalizeRating` also falls back to reading the
subject off the key, so a row is never mislabelled even if the column is missing.

## Rules for changing anything

1. Run Radar's `supabase/schema.sql` first on a fresh project. Sonar's file opens with a
   prerequisite check and raises a readable error if the shared tables are missing.
2. Both files are idempotent and applied by hand through the SQL editor. Neither drops
   anything.
3. A new column goes in as `alter table ... add column if not exists`, not by editing a
   `create table` — the create is skipped on a live database.
4. Adding a column to a shared table is allowed (Radar ignores columns it does not know)
   but writing one Radar owns is not. Sonar's sparse upsert of `user_settings` is written
   the way it is so it cannot clobber Radar's notification and streak columns.
5. If a change would make Radar render or write something wrong, it belongs in a
   Sonar-owned table instead.

## Performance note

The user's framing when this was decided: "even if it will slow it down". In practice the
shared project costs nothing measurable — the two apps query different tables, and the
only shared reads are profile rows and the friend list, both small and cached for
minutes. The realtime channels are per-user-filtered, so neither app wakes for the
other's writes.

The one place to watch is `album_activity`'s realtime subscription
(`features/social/useFriendActivity`), which cannot filter on "user_id in (…)" and so
wakes on every insert to that table. It is Sonar's own table, so only Sonar's writes hit
it, and the handler only invalidates a query — but if the feed ever gets busy, that is
the thing to narrow.

## The Firebase past

The old Sonar stored everything in Firebase Realtime Database under
`users/<firebaseUid>/…`. Nothing reads it any more. `scripts/migrate-firebase.ts` imports
a JSON export into the shared project — it needs an explicit
`--map <firebaseUid>=<supabaseUserId>`, because the two id spaces are unrelated and
guessing would file someone else's records under your account. It is idempotent: albums
and ratings upsert on `(user_id, album_key)`, spins skip anything already stored at the
same instant.
