import { isOwned } from '@/lib/albumStatus';
import { summarizeSpins, topSpun, type SpinSummary } from '@/lib/spins';
import type { Album, AlbumRating, Spin } from '@/types/album';

// Every number the Stats screen shows, derived in one pure pass. Ported from
// the legacy Stats.jsx useMemo, which computed all of this inline inside the
// screen; the screen now only lays out what this returns.
//
// "Collection" everywhere means status === 'Collection': a wishlist entry is a
// plan and must not inflate what you own, what it cost, or the format split.

export type CountSlice = { name: string; count: number; percent: number };
export type DecadeSlice = { decade: string; count: number };

export type CollectionStats = {
  totalAlbums: number;
  wishlistCount: number;
  preOrderCount: number;
  uniqueArtists: number;
  formats: CountSlice[];
  topArtists: CountSlice[];
  topGenres: CountSlice[];
  topStores: CountSlice[];
  decades: DecadeSlice[];
  totalValue: number;
  averagePrice: number | null;
  mostExpensive: { album: Album; price: number }[];
  /** Spin log rollups, already scoped to the chosen period by the caller. */
  spins: SpinSummary;
  mostSpun: { album: Album; count: number }[];
  ratedCount: number;
  averageRating: number | null;
  bestRated: { album: Album; score: number }[];
};

function percentOf(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function toSlices(counts: Map<string, number>, total: number, limit?: number): CountSlice[] {
  const list = [...counts]
    .map(([name, count]) => ({ name, count, percent: percentOf(count, total) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return limit ? list.slice(0, limit) : list;
}

function bump(counts: Map<string, number>, key: string) {
  const clean = key.trim();
  if (clean) counts.set(clean, (counts.get(clean) ?? 0) + 1);
}

export type StatsInput = {
  albums: Album[];
  spins: Spin[];
  ratings: AlbumRating[];
  /** The score rule, injected so this file stays free of React imports. */
  scoreOf: (ratings: AlbumRating) => number | null;
};

export function computeStats({ albums, spins, ratings, scoreOf }: StatsInput): CollectionStats {
  const collection = albums.filter(isOwned);
  const total = collection.length;

  const formats = new Map<string, number>();
  const artists = new Map<string, number>();
  const genres = new Map<string, number>();
  const stores = new Map<string, number>();
  const decades = new Map<number, number>();
  const priced: { album: Album; price: number }[] = [];
  let totalValue = 0;

  for (const album of collection) {
    for (const format of album.formats) bump(formats, format);
    for (const artist of album.artist) bump(artists, artist);
    for (const genre of album.genres) bump(genres, genre);
    if (album.storeName) bump(stores, album.storeName);

    if (album.releaseDate && album.releaseDate.length >= 4) {
      const year = parseInt(album.releaseDate.slice(0, 4), 10);
      if (!Number.isNaN(year)) {
        const decade = Math.floor(year / 10) * 10;
        decades.set(decade, (decades.get(decade) ?? 0) + 1);
      }
    }

    if (album.pricePaid != null && album.pricePaid > 0) {
      totalValue += album.pricePaid;
      priced.push({ album, price: album.pricePaid });
    }
  }

  const spinSummary = summarizeSpins(spins);

  // Ratings are keyed by release, not by album row, so a rating for something
  // no longer on the shelf still counts towards how you rate — but "best rated"
  // can only link to albums that exist, so that list joins back through the key.
  const byKey = new Map(albums.map((album) => [album.albumKey, album]));
  let ratingTotal = 0;
  let ratedCount = 0;
  const scoredAlbums: { album: Album; score: number }[] = [];

  for (const rating of ratings) {
    const score = scoreOf(rating);
    if (score == null || score <= 0) continue;
    ratingTotal += score;
    ratedCount += 1;
    const album = byKey.get(rating.albumKey);
    if (album) scoredAlbums.push({ album, score });
  }

  return {
    totalAlbums: total,
    wishlistCount: albums.filter((album) => album.status === 'Wishlist').length,
    preOrderCount: albums.filter((album) => album.status === 'Pre-order').length,
    uniqueArtists: artists.size,
    formats: toSlices(formats, total),
    topArtists: toSlices(artists, total, 5),
    topGenres: toSlices(genres, total, 5),
    topStores: toSlices(stores, total, 5),
    decades: [...decades].sort((a, b) => a[0] - b[0]).map(([decade, count]) => ({ decade: `${decade}s`, count })),
    totalValue: Math.round(totalValue * 100) / 100,
    averagePrice: priced.length === 0 ? null : Math.round((totalValue / priced.length) * 100) / 100,
    mostExpensive: priced.sort((a, b) => b.price - a.price).slice(0, 5),
    spins: spinSummary,
    mostSpun: topSpun(collection, spinSummary, 5),
    ratedCount,
    averageRating: ratedCount === 0 ? null : Math.round((ratingTotal / ratedCount) * 10) / 10,
    bestRated: scoredAlbums.sort((a, b) => b.score - a.score || a.album.title.localeCompare(b.album.title)).slice(0, 5),
  };
}
