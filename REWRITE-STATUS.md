# Sonar native rewrite — status and resume brief

**Purpose of this file:** everything needed to resume the rewrite cold. If this file is
mentioned, read it and continue at "Next actions" without re-exploring either repo.

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
| Where does the rewrite live | `C:\stuff\sonar`, old Vite/Firebase app moved to `C:\stuff\sonar\archive\` |
| Firebase RTDB data | Migrate — write a one-off script (`scripts/migrate-firebase.ts`) |
| Rating shape | Facets + overall, Radar style: `production`, `vocals`, `lyrics`, `replay`, `overall` |
| Spotify credentials | Provided; client id `64728b5e13784d218442b13368311be3`, secret in `.env` (gitignored). No redirect URI needed — client-credentials flow only |

Working branch: **`feat/native-rewrite`** (branched from `main`, commit `9066abe`).

---

## 2. What the two apps are

- **Radar** (`C:\stuff\radar`) — the reference. Expo SDK 57, expo-router, NativeWind,
  Supabase, TanStack Query, zustand + MMKV, FlashList, Reanimated 4. Movie/TV watchlist.
  Its `CLAUDE.md` holds the working agreement; `rewrite/10-code-conventions.md` holds the
  file-size and layering rules (~200-line soft cap, one component per file, screens compose
  only, logic in `features/*/use*.ts`, pure helpers in `src/lib/`).
- **Sonar** (`C:\stuff\sonar`) — was a Vite + Firebase RTDB + Capacitor web app for a music
  collection (albums, formats, spins, wishlist, friends, public shelf, stats). Now being
  rebuilt as an Expo app on Radar's skeleton.

## 3. Shared-database design (already settled)

One Supabase project, shared with Radar (free plan = one project). **Shared, not duplicated:**
`public.profiles`, `public.friendships`, `public.friend_requests`, `public.user_settings`,
`private.can_view()`, and the `accept_friend_request` / `decline_friend_request` /
`remove_friend` / `can_view_user` RPCs — all created by Radar's `supabase/schema.sql`, which
must be run first.

**Sonar's own tables** (in `C:\stuff\sonar\supabase\schema.sql`, written, idempotent, not yet
run against the project):

- `albums` — collection rows. `album_key` identity, `formats text[]`, `status` CHECK
  (`Collection|Wishlist|Pre-order`), pressing fields (`store_name`, `price_paid`,
  `catalog_number`, `acquisition_date`), `custom_order` (shelf order), `last_listened_at`
  (mirror of the newest spin).
- `album_spins` — one row per listen; the source of truth for "last played".
- `album_ratings` — **keyed `(user_id, album_key)` with no FK to `albums`.** This is what
  makes rating an unowned release possible, and what makes a rating survive removing the
  album. Carries a title/artist/cover snapshot so it renders alone.
- `album_activity` (+ `album_activity_reactions`, `album_activity_comments`) — Sonar's feed.
  Separate from Radar's `public.activity` on purpose: Radar's client `select *`s that table
  and normalizes every row as a film, so album rows there would render as broken movies.

RLS mirrors Radar exactly: owner-all policy plus a `private.can_view(user_id)` read policy.
Privacy is therefore **one switch across both apps** — deliberate, documented in the SQL.

`user_settings`: Sonar reads/writes **only** `friends_visibility` and `theme` (see
`src/lib/userSettings.ts`); the sparse upsert cannot clobber Radar's columns. Radar's
`profiles.favorites` (its pinned top 4, capped at 4) is **never** written by Sonar — Sonar's
shelf derives "top rated" instead.

`album_key` (`src/lib/albumKey.ts`): `spotify:<id>` when Spotify knows the release, else
`manual:<slug(first artist)>|<slug(title)>`.

---

## 4. Project state — files that exist

Root config (all written): `package.json` (Expo 57 dep set, scripts incl. `migrate:firebase`),
`app.json` (name Sonar, slug sonar, scheme sonar, package `com.michaldakowicz.sonar`, version
3.0.0, versionCode 1), `tsconfig.json` (`@/*` → `src/*`, `@/assets/*` → `assets/*`),
`babel.config.js`, `metro.config.js` (svg transformer + NativeWind), `tailwind.config.js`
(copied from Radar), `nativewind-env.d.ts`, `eslint.config.js` (ignores `archive/*`),
`firebase.json` + `.firebaserc` (hosting project `sonar-tracker`, SPA rewrite, serves `dist/`),
`.gitignore`, `.env` (real values: shared Supabase URL/anon/service-role copied from Radar,
Spotify id/secret, `FIREBASE_DATABASE_URL`), `.env.example`, `supabase/schema.sql`.

### Copied from Radar verbatim (then re-pointed at album types / emerald accent)

`src/global.css`, `src/theme/ThemeProvider.tsx`, `src/lib/{mmkvStorage,stripUndefined,queryClient,supabase,shelfLink}.ts`,
`src/components/ui/{Sheet,SheetPanel,SheetDialog,sheetTypes,Toast,SearchInput,EmptyState,LoadingState,ErrorState,SectionHeader,ConfirmDialog,BackButton}`,
`src/components/layout/{ContentShell,ScreenTop,NavDestinationButton,NavIslands,PublicHeader}`,
`src/hooks/{useResponsive,useNavBarSpace,useScrollToTopOnChange,useSearchFocusRegistration,useWebShortcuts,useFriends,useUserSearch}`,
`src/store/{tabReload,searchFocus,quickAddSheet,statsPeriod,socialWatermark}`,
`src/features/auth/AuthProvider.tsx`, `src/features/friends/{Avatar,FriendCard,FriendRequestItem,FriendRequestListener}`,
`src/features/settings/{SettingsSection,Segmented,ThemeControl,PrivacyControl}`,
`src/components/stats/{QuickStat,ThinProgressBar,DecadeBars,GenreTag,HistoryPill}`,
`assets/brand/google.svg`.

A sweep replaced Radar's blue `hsl(217 91% 60%)` / `hsla(217,91%,60%,…)` with Sonar's emerald
`hsl(160 84% 39%)` / `hsla(160,84%,39%,…)` in every copied file (0 occurrences remain).

### Written for Sonar

- **Theme/types:** `src/theme/colors.ts` (emerald `--primary`, plus a `COLORS` table for the
  places NativeWind classes cannot reach), `src/types/album.ts`.
- **Pure lib:** `albumKey`, `formats`, `albumStatus`, `normalizeAlbum` (read boundary +
  `toAlbumRow` write map), `personalScore`, `ratings` (facet table, `recalcOverall`,
  `toRatingsPayload`, `isEmptyRatings`), `collectionSearch`, `collectionSort` (comparators,
  `shelfOrder`, `orderBetween`, `canReorder`), `collectionFacets` (facets + matchers +
  `groupAlbums`), `spins` (summaries, `recentlyPlayed`, `spinsPerDay`, `listeningStreak`),
  `stats` (`computeStats`), `statsPeriod`, `utils`, `spotify` (client-credentials token cache,
  search, album, tracks, new releases, artist albums, `parseAlbumInput`), `socialFeed`
  (feed kinds/verbs/`weekDigest`/`freshCountsSince`), `ratingDistribution`, `shelfSummary`,
  `dataTransfer` (v2 export + importer that also reads the legacy Firebase export),
  `userSettings`.
- **Hooks:** `useAlbums` (query + realtime + add/update/remove + activity logging),
  `useSpins` (log/remove + mirror maintenance + `usePublicSpins`), `useAlbumRatings`
  (`ratingFor`, `scoreFor`, `saveRating`, `removeRating`, `usePublicRatings`), `useProfile`
  (shared identity row, no `favorites`), `useUserSettings` (two shared columns only).
- **Nav:** `src/components/layout/navDestinations.tsx` (Collection / Discover / Stats /
  Social / Profile), `navActions.tsx` (per-tab left action: Add sheet, search focus, period
  sheet, inbox, settings; Back on `/settings`, `/inbox`, `/history`).
- **Media components:** `CoverImage`, `FormatBadges` (+ `FormatLine`, `StatusBadge`,
  `StatusPill`), `RatingStars` (+ `ScoreBadge`), `AlbumCard` (variants `cover` / `row` /
  `featured` / `compact`; square art, not 2:3), `AlbumGrid` (column table + gaps),
  `AlbumCarousel`.
- **Collection feature:** `store/collectionPrefs.ts` (+ `activeFilterCount`),
  `useCollectionFilters`, `CollectionToolbar`, `FacetFilterRow` (+ `ChoiceRow`),
  `CollectionFilterSheet`, `GroupingSheet`, `CollectionSection`, `CollectionGroups`.
- **Add flow:** `useQuickAdd`, `useSpotifySearch` (+ `useDebounced`, `useSpotifyAlbum`,
  `useNewReleases`), `FormatStatusPicker`, `AddSearchResults`, `QuickAddSheet`.
- **Album detail/edit:** `edit/albumForm.ts` (form ⇄ payload, `validate`, `isDirty`),
  `edit/useEditAlbumForm.ts`, `detail/DetailHero`, `detail/PressingDetails`,
  `detail/TrackList`, `detail/SpinHistory`, `detail/useAlbumDetail` (resolves owned row *or*
  Spotify release from one key), `detail/AlbumDetailScreen` (one screen for owned + unowned).
- **Ratings feature:** `ratings/RatingSlider.tsx` (tap steps + precise drag),
  `ratings/RatingEditor.tsx` — works with no album row, which is the headline new feature.
- **Routes so far:** `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`,
  `src/app/(tabs)/index.tsx` (collection), `src/app/(tabs)/discover.tsx`.

---

## 5. Next actions (in order)

1. **`src/lib/releasePreview.ts`** — `releaseToAlbum(release: SpotifyAlbum): Album`, turning a
   Spotify hit into a card-shaped `Album` whose `id` is the release key. **`discover.tsx`
   already imports this and it does not exist yet — write it first or the build fails.**
2. **Stats:** `src/features/stats/useStats.ts`, `StatsView.tsx`, `StatsPeriodSheet.tsx`
   (the tabs layout already mounts `StatsPeriodSheet` with an `onPicked` prop), then
   `src/app/(tabs)/stats.tsx`.
3. **Social:** `src/features/social/{FeedView,FeedCard,FriendsView,FindView,ActivityRail}.tsx`
   + `useFriendActivity.ts` (+ `useFeedWatermark.ts` over `store/socialWatermark`), then
   `src/app/(tabs)/social.tsx` (segmented Activity / Friends / Find, mirroring Radar) and
   `src/app/inbox.tsx` (friend requests).
4. **Profile:** `src/features/profile/{MyShelfHeader,ShelfSections,RatingsDistribution,RandomSpinSheet}.tsx`,
   reuse `EditProfileSheet` (port Radar's — needs `expo-image-picker` +
   `expo-image-manipulator`, both already in `package.json`), then `src/app/(tabs)/profile.tsx`.
5. **Remaining routes:** `src/app/login.tsx` (port Radar's, rebrand to Sonar + emerald),
   `src/app/settings.tsx` (Privacy, Appearance/theme + card size, Data → import/export,
   share shelf link, sign out), `src/app/history.tsx` (full spin log, delete a spin),
   `src/app/album/[albumId].tsx`, `src/app/release/[albumKey].tsx`, `src/app/reorder.tsx`
   (shelf order — see "Reorder" note below), `src/app/friend/[friendId]/index.tsx`,
   `src/app/u/[userId]/{_layout,index,stats,friends}.tsx` (public shelf, anon-readable).
6. **Settings feature files:** `ImportExportSheet.tsx` (over `lib/dataTransfer`, using
   `expo-document-picker` + `expo-file-system` + `expo-sharing`), `DataTools.tsx`.
7. **Auth:** `src/features/auth/authActions.ts` — port Radar's but **drop the
   `clearPushToken()` call** (Sonar has no push). Google OAuth via `expo-web-browser` + PKCE.
8. **Assets + icons:** copy `archive/assets/icon*.svg` and `archive/logo.svg` into
   `assets/brand/` (need `logo.svg`, `logo-mono.svg`, `splash.svg`), port
   `radar/scripts/generate-icons.mjs` to `scripts/generate-icons.mjs`, run `npm run icons`
   to produce `assets/images/{icon,favicon,splash-icon,android-icon-*}.png`.
9. **Migration script:** `scripts/migrate-firebase.ts` — read the Firebase RTDB export
   (`users/<uid>/albums`, `.../history`, `.../profile`), map legacy fields (`format` →
   `formats`, `lastListened` → `last_listened_at`, epoch millis → ISO, `rating` → an
   `album_ratings` row), insert with the service-role key. Needs a firebase-uid → supabase-uid
   mapping argument; print a dry-run summary first.
10. **Tests:** co-located `*.test.ts` for the pure libs — `albumKey`, `collectionSort`,
    `collectionFacets`, `ratings`, `spins`, `stats`, `dataTransfer`, `albumForm`.
11. **Docs:** rewrite `README.md`, write `CLAUDE.md` (adapt Radar's working agreement: branch
    triage, conventional commits with **no self-attribution**, version bump in `app.json`,
    `UPDATE.md` notes, tests+lint+tsc before commit, build to the phone over ADB then
    `npm run deploy:web`), `UPDATE.md` + `UPDATE-schema.md`, and a short
    `docs/shared-database.md` explaining the one-project setup.
12. **Verify:** `npm install`, then `npx tsc --noEmit`, `npm run lint`, `npm test`,
    `npm run build:web`. Then Android: `npx expo prebuild -p android`,
    `cd android && ./gradlew assembleRelease`, `adb install -r`, launch with
    `adb shell monkey -p com.michaldakowicz.sonar -c android.intent.category.LAUNCHER 1`.
13. **Run the SQL:** tell the user to paste `supabase/schema.sql` into the Supabase SQL
    editor (Radar's `schema.sql` first if the project is fresh). The file's prerequisite
    check raises a clear error if Radar's tables are absent.
14. Commit in coherent steps on `feat/native-rewrite`. Do not merge or open a PR unasked.

### Reorder note

The legacy web app had dnd-kit drag-to-reorder. The plan is a dedicated `/reorder` screen
(list view, move up / down / to top / to bottom) writing `custom_order` via
`orderBetween()` from `lib/collectionSort.ts`, rather than drag inside a virtualized list.
`canReorder()` already encodes when hand order is coherent (shelf-order sort, no grouping, no
search, no filters).

---

## 6. Conventions to keep following

- ~200-line soft cap per file, 300 hard. One component per file. Named exports.
- Screens (`src/app/**`) compose only: no filter logic, no data massaging.
- Derive logic → `features/*/use*.ts`; pure helpers → `src/lib/*.ts`; presentational
  components take props and import neither `supabase` nor `spotify`.
- All reads go through the `normalizeAlbum` / `normalizeRating` / `normalizeSpin` boundary;
  all writes through `toAlbumRow` + `stripUndefined`.
- Durable UI prefs → zustand + MMKV (`store/*`), never ad-hoc AsyncStorage.
- Comments explain *why*, in the register Radar's source uses — no narration of what the code
  plainly does, no "ported from X" without the reason.
- Emerald is the accent; use theme tokens (`bg-background`, `text-foreground`, `text-primary`,
  `border-border`) and `COLORS.*` for icon/style props.
- Commits: Conventional Commits, imperative, ~50 char subject, **no Claude self-attribution**.

## 7. Environment facts

- Working dir `C:\stuff\sonar`; Windows, PowerShell + Git Bash both available.
- Large file writes: use the Write tool. A bash heredoc containing SQL `$$` blocks failed
  once mid-build — do not fight it.
- Supabase project ref lives in `.env` (`EXPO_PUBLIC_SUPABASE_URL`, shared with Radar).
- Web hosting: Firebase project `sonar-tracker`, serves `dist/` (`npm run deploy:web`).
- The old app is at `archive/` and still readable for behaviour questions
  (`archive/src/pages/Home.jsx`, `archive/src/pages/Stats.jsx`,
  `archive/src/features/albums/*`, `archive/src/hooks/*`).
