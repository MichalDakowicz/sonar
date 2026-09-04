import type { Album } from '@/types/album';

// Collection sort comparators. Each is written in canonical ascending form and
// the direction is applied on top, so the toolbar arrow can flip any sort.
// SORT_DEFAULT_DIR keeps the order each sort reads best in when first picked:
// newest / highest / most-recent first for the date and score sorts, A-Z and
// cheapest first for the rest.

export type SortBy = 'custom' | 'dateAdded' | 'title' | 'artist' | 'releaseDate' | 'rating' | 'lastListened' | 'price';
export type SortDir = 'asc' | 'desc';

export const SORT_DEFAULT_DIR: Record<SortBy, SortDir> = {
  custom: 'asc',
  dateAdded: 'desc',
  title: 'asc',
  artist: 'asc',
  releaseDate: 'desc',
  rating: 'desc',
  lastListened: 'desc',
  price: 'desc',
};

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'custom', label: 'Shelf order' },
  { value: 'dateAdded', label: 'Date added' },
  { value: 'title', label: 'Title' },
  { value: 'artist', label: 'Artist' },
  { value: 'releaseDate', label: 'Release date' },
  { value: 'rating', label: 'Rating' },
  { value: 'lastListened', label: 'Last played' },
  { value: 'price', label: 'Price paid' },
];

function time(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Shelf order. An album that has never been dragged has no customOrder, and
 * falls back to the negated add time so it sorts where "newest first" would put
 * it — the same rule the legacy web app used, so an existing shelf keeps the
 * order it was left in.
 */
export function shelfOrder(album: Album): number {
  return album.customOrder != null ? album.customOrder : -time(album.addedAt);
}

/** Sparse midpoint for a drag: only the row that moved is rewritten. */
export const ORDER_GAP = 100_000;

export function orderBetween(previous: Album | undefined, next: Album | undefined): number {
  if (!previous && !next) return 0;
  if (!previous) return shelfOrder(next!) - ORDER_GAP;
  if (!next) return shelfOrder(previous) + ORDER_GAP;
  return (shelfOrder(previous) + shelfOrder(next)) / 2;
}

export type SortContext = {
  /** Overall score per album key, from the ratings table (0 when unrated). */
  scoreFor: (album: Album) => number;
};

function compareAscending(a: Album, b: Album, sortBy: SortBy, context: SortContext): number {
  switch (sortBy) {
    case 'custom':
      return shelfOrder(a) - shelfOrder(b);
    case 'dateAdded':
      return time(a.addedAt) - time(b.addedAt);
    case 'artist':
      return (a.artist[0] ?? '').localeCompare(b.artist[0] ?? '');
    case 'releaseDate':
      return time(a.releaseDate) - time(b.releaseDate);
    case 'rating':
      return context.scoreFor(a) - context.scoreFor(b);
    case 'lastListened':
      return time(a.lastListenedAt) - time(b.lastListenedAt);
    case 'price':
      return (a.pricePaid ?? 0) - (b.pricePaid ?? 0);
    case 'title':
    default:
      return a.title.localeCompare(b.title);
  }
}

export function compareAlbums(a: Album, b: Album, sortBy: SortBy, dir: SortDir, context: SortContext): number {
  const ascending = compareAscending(a, b, sortBy, context);
  // Ties fall back to title so the grid never reshuffles between renders (two
  // unrated albums, two albums never played, everything added the same second).
  const resolved = ascending !== 0 ? ascending : a.title.localeCompare(b.title);
  return dir === 'asc' ? resolved : -resolved;
}

/** Reordering by hand is only coherent while the list is the whole, unsorted shelf. */
export function canReorder(input: {
  sortBy: SortBy;
  groupBy: string;
  searchQuery: string;
  activeFilterCount: number;
}): boolean {
  return input.sortBy === 'custom' && input.groupBy === 'none' && !input.searchQuery.trim() && input.activeFilterCount === 0;
}
