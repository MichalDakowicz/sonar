# Sonar

**Curate your physical & digital collection.**

Sonar tracks a music collection — vinyl, CD, cassette, digital — across a native Android
app and the web, on the same account as [Radar](https://github.com/MichalDakowicz/radar).

## Features

- **Your shelf, your order.** Filter by format, artist, genre, year or status; group by
  any of them; sort by shelf order, rating, last played or price; drag-free reordering.
- **Rate anything.** Four facets (production, vocals, lyrics, replay) plus an overall
  score — and ratings hang off the *release*, so you can rate a record you do not own and
  keep the score if you sell it.
- **Spins.** Log a listen from any card, see the whole history, and let it drive
  "recently played", "most spun" and a listening streak.
- **Wishlist and pre-orders** alongside what you actually have, without polluting the
  numbers: every collection stat counts owned records only.
- **Pressing details.** Store, price paid, catalogue number, acquisition date, favourite
  tracks, notes.
- **Discover.** Spotify search and new releases, added to your shelf in one tap.
- **Social.** Friends' activity feed with reactions, friend requests, and a public shelf
  you can share by link — one friend list shared with Radar.
- **Stats.** Format split, top artists, release eras, genres, where records came from,
  what you have spent, and the shape of how you rate.

## Tech

React Native / Expo (SDK 57), Expo Router, NativeWind, Supabase (Postgres + RLS +
realtime), TanStack Query, Zustand + MMKV, FlashList, Reanimated. Spotify's Web API
provides metadata through the client-credentials flow.

The app is built on Radar's skeleton — the same nav islands, sheet primitives, theme
tokens and layering conventions — so a component moves between the two projects without
restyling.

## Getting started

```sh
npm install
cp .env.example .env     # then fill it in
npm start
```

`.env` needs:

| Variable | Why |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | The shared Supabase project |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`, `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` | Metadata search (optional — the app falls back to adding albums by hand) |
| `SUPABASE_SERVICE_ROLE_KEY` | Only `scripts/migrate-firebase.ts` |

### Database

Run Radar's `supabase/schema.sql` first if the project is fresh, then this repo's
`supabase/schema.sql` — Supabase Dashboard → SQL Editor → paste → Run. Both are
idempotent. See [docs/shared-database.md](docs/shared-database.md) for what is shared and
the rules for changing it.

### Android

```sh
npx expo run:android --device      # dev build
npx expo prebuild -p android       # after app.json / native changes
cd android && ./gradlew assembleRelease
```

### Web

```sh
npm run deploy:web                 # exports and deploys to Firebase Hosting
```

## Importing the old app's data

The previous Sonar was a Vite + Firebase web app; it is kept at `archive/` for reference.
Its data comes across either way:

- **From a JSON export**, in the app: Settings → Data → Import / export.
- **In bulk**, from a Firebase console backup:

  ```sh
  npm run migrate:firebase -- --map <firebaseUid>=<supabaseUserId> --file backup.json
  npm run migrate:firebase -- --map <firebaseUid>=<supabaseUserId> --file backup.json --commit
  ```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm test` | Jest, over the pure logic in `src/` |
| `npm run lint` | ESLint |
| `npm run build:web` / `npm run deploy:web` | Web export / deploy |
| `npm run icons` | Regenerates app icons from `assets/brand/logo.svg` |
| `npm run migrate:firebase` | One-off Firebase RTDB import |

## License

See [LICENSE](LICENSE).
