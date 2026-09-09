// App-side shapes, produced at the read boundary (lib/normalizeAlbum,
// lib/normalizeRating). Screens consume these, never a raw Postgres row.

/** A copy you own of a release. Physical or not — "Digital" is a format too. */
export type Format = 'Vinyl' | 'CD' | 'Cassette' | 'Digital';

/** Where a release sits on your shelf. Mutually exclusive, unlike Format. */
export type AlbumStatus = 'Collection' | 'Wishlist' | 'Pre-order';

/**
 * The four facets plus the overall score, in the same jsonb shape Radar stores
 * film ratings in — so lib/personalScore is one function shared by both apps.
 * Every value is 0–5 in half steps (overall in 0.1 steps); 0 means unrated.
 */
export type Ratings = {
  production?: number;
  vocals?: number;
  lyrics?: number;
  replay?: number;
  overall?: number;
};

/**
 * What a rating is *about*. A song is not folded into its album and an artist is
 * not the average of theirs: they are separate opinions, and a great single on a
 * weak record is a normal thing to think.
 *
 * Only 'album' can also be owned — songs and artists are rate-only, which the
 * FK-less ratings table already allowed for.
 */
export type RatingSubject = 'album' | 'song' | 'artist';

/**
 * A rating, which exists independently of owning anything (public.album_ratings
 * has no FK to public.albums). `albumKey` identifies the subject: 'spotify:<id>'
 * for a release Spotify knows, 'spotify:song:<id>', 'spotify:artist:<id>', else
 * 'manual:<artist>|<title>' (lib/albumKey).
 */
export type AlbumRating = {
  userId: string;
  albumKey: string;
  subject: RatingSubject;
  spotifyId: string | null;
  title: string;
  artist: string[];
  coverUrl: string | null;
  releaseDate: string | null;
  ratings: Ratings;
  review: string;
  createdAt: string;
  updatedAt: string;
};

export type Album = {
  id: string;
  userId: string;
  spotifyId: string | null;
  albumKey: string;
  title: string;
  artist: string[];
  coverUrl: string | null;
  /** Year, year-month or full date — Spotify's precision varies by release. */
  releaseDate: string | null;
  releaseDatePrecision: string | null;
  totalTracks: number | null;
  genres: string[];
  url: string;
  formats: Format[];
  status: AlbumStatus;

  // pressing / personal details
  notes: string;
  favoriteTracks: string;
  acquisitionDate: string | null;
  storeName: string;
  pricePaid: number | null;
  catalogNumber: string;

  customOrder: number | null;
  /** Mirror of the newest spin (lib/spins is the source of truth). */
  lastListenedAt: string | null;
  addedAt: string;
  updatedAt: string;
};

/** One logged listen. */
export type Spin = {
  id: string;
  userId: string;
  albumId: string | null;
  albumKey: string | null;
  title: string;
  artist: string[];
  coverUrl: string | null;
  playedAt: string;
};

export type AlbumActivityType =
  | 'added'
  | 'logged_spin'
  | 'status_changed'
  | 'rating_changed'
  | 'format_added'
  | 'updated'
  | 'removed';

export type AlbumActivityEvent = {
  id: string;
  userId: string;
  albumId: string | null;
  albumKey: string | null;
  albumTitle: string;
  type: AlbumActivityType;
  details: Record<string, unknown>;
  createdAt: string;
};

/**
 * The shared identity row (public.profiles), read here without Radar's
 * `favorites` column on purpose: that column holds Radar's pinned top 4 and is
 * capped at four entries, so writing album picks into it would silently
 * overwrite the films the same person pinned in the other app. Sonar's shelf
 * leads with its top-rated releases instead, which it can derive.
 */
export type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  pfp: string | null;
  createdAt: string;
};
