# Sonar native rewrite — status and resume brief

**Purpose of this file:** everything needed to resume cold. If this file is mentioned,
read it and continue at "Next actions" without re-exploring either repo.

**State: shipped.** Types, lint and 82 tests pass; the schema is applied; the APK is
installed and boots on the device; the web build is live at https://sonar-tracker.web.app.
What is left is a real-session walkthrough and the data import — see "Next actions".

---

## 1. The task, as given

> "following the `radar/` app build and design rewrite `sonar/` to the exact same style and
> way of working, also make both apps use the same database even if it will slow it down,
> i dont have money for paid supabase so this will have to do. rewrite the app fully using
> radar as the new native skeleton, add a rating system to the albums where the user can
> rate even an unowned piece of media"

Decisions the user made when asked (do not re-ask):

| Question | Answer |
| --- | --- |
| Where the rewrite lives | `C:\stuff\sonar`; old Vite/Firebase app moved to `archive/` |
| Firebase RTDB data | Migrate — `scripts/migrate-firebase.ts` (written, dry-run tested) |
| Rating shape | Facets + overall, Radar style: `production`, `vocals`, `lyrics`, `replay`, `overall` |
| Spotify credentials | Provided; client id `64728b5e13784d218442b13368311be3`, secret in `.env` (gitignored). Client-credentials flow, so no redirect URI needed |

Branch: **`feat/native-rewrite`** off `main` (`9066abe`). Commits so far:

```
75f2686 feat(social): add comment threads on feed activity
88bb24b test: cover the pure collection and rating rules
47d6744 docs: document the rewrite, and add the Firebase import
551dce4 feat: rebuild every screen on the native skeleton
07f688b feat: port the shell and card system from Radar
a3022ad feat: add the album data layer and pure collection logic
9e211e6 feat(db): add Sonar's tables to the shared Supabase project
f8e8685 chore: scaffold the Expo project on Radar's stack
571020b chore: archive the Vite and Firebase web app
```

No PR opened. Do not merge without being asked.

## 2. What was built

Expo SDK 57 app on Radar's skeleton: expo-router, NativeWind, Supabase, TanStack Query,
Zustand + MMKV, FlashList, Reanimated. Emerald accent (`--primary: 160 84% 39%`) is the
only token that differs from Radar.

**Five tab destinations**, nav islands with a per-screen left action, exactly as Radar:
Collection (Add sheet) · Discover (search focus) · Stats (period sheet) · Social (inbox) ·
Profile (settings). Pushed routes: `album/[albumId]`, `release/[albumKey]`,
`activity/[activityId]`, `history`, `reorder`, `inbox`, `settings`, `login`,
`u/[userId]/{index,stats,friends}`.

**The rating system** is the headline addition: `album_ratings` is keyed
`(user_id, album_key)` with **no FK to `albums`**, so a release can be rated whether or
not it is owned, and the score survives removing and re-adding the album. Four facets at
half-star steps plus a draggable overall (0.1 steps) with an "average" button. Reachable
from an owned album, a Spotify search result, a friend's shelf and a feed row — all of
which route to the same `AlbumDetailScreen`.

Also: spins (log/delete, with the `albums.last_listened_at` mirror re-derived on delete),
formats as a multi-select, wishlist/pre-orders, pressing details, shelf reordering,
grouping, facet filters, Spotify search + new releases, stats (formats, artists, eras,
genres, stores, spend, spins, streak, rating curve), the social feed with reactions and
comment threads, friend requests, public shelf, JSON import/export that also reads the
legacy Firebase export.

## 3. Shared-database design

One Supabase project with Radar — full rationale and rules in `docs/shared-database.md`.

Shared and **not** re-created: `public.profiles`, `public.friendships`,
`public.friend_requests`, `public.user_settings`, `private.can_view()`, and the
accept/decline/remove-friend + `can_view_user` RPCs. All from Radar's
`supabase/schema.sql`, which must be run first.

Sonar's own tables (in `supabase/schema.sql`, idempotent, already applied): `albums`,
`album_spins`, `album_ratings`, `album_activity`, `album_activity_reactions`,
`album_activity_comments`.

Hard rules: Sonar writes only `friends_visibility` and `theme` on `user_settings`;
`profiles.favorites` is Radar's and is never touched (Sonar's shelf derives "rated
highest" instead); album activity lives in its own table because Radar `select *`s
`public.activity` and normalizes every row as a film.

`album_key` = `spotify:<id>`, else `manual:<slug(first artist)>|<slug(title)>`
(`src/lib/albumKey.ts`).

## 4. Verification already done

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npx expo lint` | clean (0 errors, 0 warnings) |
| `npx jest` | 8 suites, 82 tests, all pass |
| `npm run build:web` | exports to `dist/` |
| `npx expo prebuild -p android` | clean |
| `./gradlew assembleRelease` | `android/app/build/outputs/apk/release/sonar-v3.0.0.apk` (114 MB, all 4 ABIs) |
| `scripts/migrate-firebase.ts` | dry run against a sample legacy export reports the right counts |

### Two build gotchas worth remembering

1. **JDK.** The machine's default is JDK 25, under which every CMake configure task fails
   with `A restricted method in java.lang.System has been called`. Build with the Android
   Studio JBR:
   `JAVA_HOME="/c/Program Files/Android/Android Studio/jbr" ./gradlew assembleRelease`.
2. **Gradle memory.** The template's 2 GB heap / 512 MB metaspace dies mid-build with a
   bare `Metaspace` error surfacing as `Could not initialize class …ProtoBuf$…`.
   `plugins/withGradleMemory.js` re-applies `-Xmx4608m -XX:MaxMetaspaceSize=1536m` on
   every prebuild (`android/` is regenerated output, so it cannot be edited by hand).

Also: `jest-expo` is pinned to `57.0.1`, not `~57.0.1` — 57.0.5 peer-wants a
`@react-native/jest-preset` newer than react-native 0.86.0 accepts, and npm refuses to
resolve it.

## 5. Shipped

- **Schema applied.** All of `albums`, `album_spins`, `album_ratings`, `album_activity`
  answer over PostgREST, so `supabase/schema.sql` has been run against the shared project.
- **Installed and launched on the device** (`00166152F003681`). The old Capacitor build
  had to be uninstalled first — same package id, different signing key
  (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`); it stored nothing locally, so nothing was lost.
  App boots to the login screen, pid alive, `ReactNativeJS: Running "main"`, no errors in
  `AndroidRuntime:E`.
- **Web deployed** to https://sonar-tracker.web.app (Firebase project `sonar-tracker`),
  after the phone install passed and the schema was confirmed present.

## 6. Next actions

1. **Sign in on the phone** and walk the app: add an album from Discover → rate something
   you did **not** add → log a spin → Stats and History → a friend's shelf. Nothing past
   the login screen has been exercised with a real session yet.
2. **Google sign-in** needs the Google provider enabled on the Supabase project (Radar
   uses it, so it should be) and `sonar://` in the allowed redirect list. Email/password
   needs nothing.
3. **Import the old Firebase data** once signed in, so the Supabase user id exists:
   ```sh
   npm run migrate:firebase -- --map <firebaseUid>=<supabaseUserId> --file backup.json
   # then again with --commit
   ```
   Or Settings → Data → Import / export with a JSON export.
4. **Release when happy**: `UPDATE.md` heading `— Unreleased` → the date, then
   `gh release create v3.0.0 android/app/build/outputs/apk/release/sonar-v3.0.0.apk`.
   The branch has no PR yet and has not been merged.

## 7. Known gaps, deliberate

- **No push notifications.** Radar has an inbox, FCM, quiet hours and a background
  metadata refresh; none of it was ported. There is no Sonar equivalent of "a release you
  are waiting for lands tomorrow" yet, and the friend-request toast covers the rest.
- **No recaps, no ranked years, no compare-taste / watch-together.** Radar-specific
  surfaces with no obvious music analogue; left out rather than half-built.
- **Reorder is buttons, not drag.** Up / down / to-top / to-bottom on a dedicated screen,
  writing a sparse midpoint (`orderBetween`). A drag gesture inside a virtualized,
  recycling grid fights the list for every pixel; `canReorder()` encodes when hand order
  is even coherent.
- **Spins are not replayed on import.** A restored log cannot be told from a real one, and
  each row would move the last-played mirror.
- **The Spotify secret ships in the client.** `EXPO_PUBLIC_*` values are compiled into the
  bundle, so the client-credentials secret is extractable from the APK — same exposure the
  old Vite app had with its `VITE_*` vars. It only buys public catalogue reads, and can be
  rotated in the Spotify dashboard. Moving it behind a Supabase edge function is the fix if
  that ever matters.

## 8. Conventions to keep following

`CLAUDE.md` is the working agreement (branch triage, conventional commits with **no
self-attribution**, version bump in `app.json` + `APP_VERSION` in `src/app/settings.tsx`,
`UPDATE.md` notes per `UPDATE-schema.md`, tests + lint + tsc before commit, phone build
then web deploy). Structure rules:

- ~200 line soft cap per file, 300 hard. One component per file, named exports.
- Screens (`src/app/**`) compose only — no filter logic, no data massaging.
- Derive logic → `features/*/use*.ts`; pure helpers → `src/lib/*.ts`; presentational
  components take props and import neither `supabase` nor `spotify`.
- **`src/lib/` imports no React or react-native.** This was learned the hard way: icon
  tables in `lib/formats` and `lib/albumStatus` made the pure modules untestable (jest
  choked on lucide's ESM). Glyphs now live in `src/components/media/Glyphs.tsx`, written
  as components with a branch per case — a `const Icon = lookup(x)` reference is a
  component identity minted during render, which the static-components lint rule rejects.
- Reads go through `normalizeAlbum` / `normalizeRating` / `normalizeSpin`; writes through
  `toAlbumRow` + `stripUndefined`.
- Durable UI prefs → Zustand + MMKV (`src/store/`).
- Emerald accent via theme tokens and `COLORS.*` (`src/theme/colors.ts`) — no stray hex.

## 9. Environment facts

- Working dir `C:\stuff\sonar`; Windows, PowerShell + Git Bash.
- Use the Write tool for large files. A bash heredoc containing SQL `$$` blocks failed
  once mid-build — do not fight it.
- `.env` holds the shared Supabase URL/anon/service-role keys, the Spotify pair, and
  `FIREBASE_DATABASE_URL`. `.env.example` is the committed shape.
- Web hosting: Firebase project `sonar-tracker`, serves `dist/`.
- The old app is still readable at `archive/` for behaviour questions
  (`archive/src/pages/Home.jsx`, `archive/src/pages/Stats.jsx`,
  `archive/src/features/albums/*`, `archive/src/hooks/*`).
