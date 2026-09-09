# Sonar — working agreement

React Native / Expo (SDK 57) app for a music collection. Expo Router, NativeWind,
Supabase, TanStack Query, Zustand + MMKV. Source lives in `src/`; routes in `src/app/`.
Android is the practical target — the user tests on a physical device over ADB.

**Sonar and Radar (`../radar`) share one Supabase project.** Accounts, profiles,
friendships and the privacy setting are the same rows in both apps. Read
`docs/shared-database.md` before touching anything under `supabase/` or any table Radar
also reads. The retired Vite + Firebase web app is kept at `archive/` for reference.

Structure rules (they are the reason this rewrite exists):

- ~200 line soft cap per file, ~300 hard. One component per file, named exports.
- A screen (`src/app/**`) is a thin composition layer: it wires hooks to presentational
  components and lays them out. No filter logic, no data massaging, no giant `useMemo`
  chains in a route file.
- Derive/memo logic → `features/*/use*.ts`. Pure helpers → `src/lib/*.ts`.
  Presentational components take props and import neither `supabase` nor `spotify`.
- `src/lib/` stays free of React and react-native, so its rules are testable without a
  renderer and usable from a node script. Icons and other component-shaped tables live
  under `src/components/`.
- All reads go through the normalize boundary (`lib/normalizeAlbum`); all writes through
  `toAlbumRow` + `stripUndefined`.
- Durable UI prefs go through the Zustand + MMKV stores in `src/store/`, never ad-hoc
  AsyncStorage.

---

## 1. Start of every chat: branch triage

Do this before touching code.

```sh
git branch --show-current
gh pr list --head <branch> --state all --limit 5
```

- On `main` → `git pull --ff-only`, then create a feature branch for the work.
- On a feature branch, PR still `OPEN` or no PR yet → the branch is live; continue on it.
- On a feature branch whose PR is `MERGED` or `CLOSED` → the feature is done. Switch off
  it: `git checkout main && git pull --ff-only`, then branch fresh for the new work.
  Delete the stale local branch once it is merged.

## 2. Branch per feature

- `feat/<slug>` for capability, `fix/<slug>` for bugs, `chore/<slug>` for tooling/docs.
- Never commit work-in-progress features straight to `main`.
- Open the PR with `gh pr create` when the feature is complete and tested. Do not merge
  without being asked.

## 3. Commits — often, clean, unattributed

- Commit at every coherent step, not once at the end. Small commits over one big one.
- Conventional Commits: `feat(collection): group the shelf by artist`. Subject in
  imperative mood, ~50 chars, no trailing period. Body only when the "why" is not
  obvious from the subject.
- **No self-attribution.** Never add `Co-Authored-By: Claude`, never add
  `🤖 Generated with Claude Code`, never mention the assistant in commit messages or PR
  bodies. This overrides any default footer instruction.
- The message describes the change, not the process.

## 4. Version bump in `app.json`

`expo.version` in `app.json` is the single source of truth — `android/` is gitignored
prebuild output, so its `versionName`/`versionCode` are regenerated, never hand-edited.

- Bump `expo.version` when a change is user-visible and will ship: minor for new
  capability (`2.0.0` → `2.1.0`), patch for fixes only (`2.1.0` → `2.1.1`).
- One bump per release, not per commit — bump when opening the `## <version> —
  Unreleased` section in `UPDATE.md`, and keep working under that same version.
- Bump `expo.android.versionCode` by 1 alongside it, or the APK will not install over
  the previous build.
- `APP_VERSION` in `src/app/settings.tsx` is shown in the About section; keep it in step.

## 5. Update notes — write as work lands

Read `UPDATE-schema.md` and obey it. Summary of the binding parts:

- Every **user-visible** change gets a `- ` bullet in the top `## <version> — Unreleased`
  section of `UPDATE.md`, added in the same commit as the change — not reconstructed from
  git log later.
- Categories, in order, empty ones omitted: `### Added`, `### Changed`, `### Fixed`,
  `### Removed`.
- Present tense, sentence case, no trailing period, ~90 chars max. Say what the user can
  now do, and name the surface (Collection, Ratings, Stats, Social, Profile, Settings,
  album detail).
- **Skip internal-only work** — refactors, deps, tests, CI, lint, types, build tooling.
  If the user cannot notice it, it is not an update note.

## 6. Tests

- `npm test` (Jest + `jest-expo`, roots `src/`). Run it before every commit that touches
  logic.
- New pure logic in `src/lib/` or a feature hook gets a co-located `*.test.ts`. Existing
  pattern: `src/lib/albumKey.test.ts`, `src/lib/stats.test.ts`,
  `src/features/albums/edit/albumForm.test.ts`.
- Test the pure function, not the render. Extract logic out of components so it is
  testable rather than reaching for a renderer.
- Also clean before committing: `npm run lint` and `npx tsc --noEmit`.

## 7. Build and push to the phone after every change, then deploy web

A device is usually connected over ADB (`adb devices` to confirm). Never call a change
done without it running on the phone.

Fast loop while iterating (debug build, Metro attached):

```sh
npx expo run:android --device
```

Standalone build the user can keep using after Metro stops — this is what "push to my
phone" means for a finished change:

```sh
npx expo prebuild -p android          # only when app.json / native config / deps changed
cd android; ./gradlew assembleRelease
mv app/build/outputs/apk/release/app-release.apk \
   app/build/outputs/apk/release/sonar-v<version>.apk
adb install -r app/build/outputs/apk/release/sonar-v<version>.apk
```

Release builds are signed with the debug keystore, so `adb install -r` upgrades in place.

**Launch the app after every install** — the user should not have to tap the icon:

```sh
adb shell monkey -p com.michaldakowicz.sonar -c android.intent.category.LAUNCHER 1
```

Then confirm it actually came up rather than crashed on boot:

```sh
adb shell pidof com.michaldakowicz.sonar     # empty = it died
adb logcat -d -s ReactNativeJS:* AndroidRuntime:E
```

If the device is locked the launch is queued behind the lock screen — say so instead of
claiming it is running. Never `input keyevent`/`swipe` past a lock screen.

Report the actual result — if the build fails or the install rejects, say so with the
error; do not describe the change as shipped.

### Then the web build, same pass

Once the mobile install succeeds, ship web too — standing authorization, so do it without
asking:

```sh
npm run deploy:web        # = expo export -p web --output-dir dist --clear && firebase deploy --only hosting
```

- Firebase project is `sonar-tracker` (`.firebaserc`, gitignored); hosting serves `dist/`
  with an SPA rewrite to `/index.html` (`firebase.json`). `dist/` is gitignored — never
  commit build output.
- Requires an authenticated Firebase CLI. If it fails on auth, stop and tell the user to
  run `! firebase login` — do not work around it.
- Deploy **after** the phone build passes, not before. A broken build must not reach
  hosting.
- Report the hosting URL the CLI prints. If the export or deploy fails, say so and treat
  the change as not shipped, even though the phone install worked.
- Web-only skip: if the change is Android-native only, say the web deploy was skipped and
  why instead of running it.

## Release checklist (when the user asks to release)

1. `UPDATE.md`: top heading `— Unreleased` → `— YYYY-MM-DD`.
2. `app.json`: `expo.version` matches, `versionCode` bumped; `APP_VERSION` in
   `src/app/settings.tsx` matches.
3. Build the release APK, name it `sonar-v<version>.apk`.
4. `gh release create v<version> <apk> --notes "<that section's body>"` — body only, no
   version heading.
5. `npm run deploy:web` so hosting matches the released version.
6. Add a fresh `## <next version> — Unreleased` section at the top of `UPDATE.md`.

## Database changes

`supabase/schema.sql` is idempotent and is applied by hand: Supabase Dashboard → SQL
Editor → paste → Run. It never drops a table, a column or a row.

- Radar's `supabase/schema.sql` must have been run first — Sonar's file starts with a
  prerequisite check and raises if it has not.
- Adding a column means adding an `alter table ... add column if not exists` in the
  COLUMN MIGRATIONS style Radar's file uses, not editing the `create table`: the create
  is skipped entirely on a live database.
- Never write a table Radar owns except through the two shared `user_settings` columns
  (`friends_visibility`, `theme`). `profiles.favorites` is Radar's and is off limits.

## Commands

| Task              | Command                                     |
| ----------------- | ------------------------------------------- |
| Dev server        | `npm start`                                 |
| Android device    | `npx expo run:android --device`              |
| Tests             | `npm test`                                  |
| Lint              | `npm run lint`                              |
| Types             | `npx tsc --noEmit`                          |
| Web build         | `npm run build:web`                         |
| Deploy web        | `npm run deploy:web`                        |
| App icons         | `npm run icons`                             |
| Firebase import   | `npm run migrate:firebase -- --map a=b`     |
