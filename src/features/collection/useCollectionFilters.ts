import { useMemo } from 'react';

import {
  groupAlbums,
  matchesArtistFilter,
  matchesFormatFilter,
  matchesGenreFilter,
  matchesStatusFilter,
  matchesYearFilter,
  type AlbumGroup,
  type GroupBy,
} from '@/lib/collectionFacets';
import { albumMatchesSearchQuery } from '@/lib/collectionSearch';
import { compareAlbums, type SortBy, type SortDir } from '@/lib/collectionSort';
import { recentlyPlayed } from '@/lib/spins';
import type { Album, Spin } from '@/types/album';
import type { StatusFilter } from '@/store/collectionPrefs';

export type CollectionFilters = {
  /** The rails above the main list. */
  recentlyPlayed: Album[];
  wishlist: Album[];
  /** Everything the filters allow, minus what the rails already showed. */
  mainAlbums: Album[];
  /** Grouped view of the same list, or null when grouping is off. */
  groups: AlbumGroup[] | null;
  /** What the random spin may draw from — owned records only. */
  spinPool: Album[];
  totalCount: number;
  filteredCount: number;
};

export type CollectionFilterInput = {
  albums: Album[];
  spins: Spin[];
  searchQuery: string;
  statusFilter: StatusFilter;
  selectedFormats: string[];
  selectedArtists: string[];
  selectedGenres: string[];
  selectedYears: string[];
  sortBy: SortBy;
  sortDir: SortDir;
  groupBy: GroupBy;
  /** Overall score per album, from the ratings table (0 when unrated). */
  scoreFor: (album: Album) => number;
};

/**
 * The one derive/memo hook for the collection screen: the screen composes this
 * plus presentational components and holds no filter logic of its own.
 */
export function useCollectionFilters({
  albums,
  spins,
  searchQuery,
  statusFilter,
  selectedFormats,
  selectedArtists,
  selectedGenres,
  selectedYears,
  sortBy,
  sortDir,
  groupBy,
  scoreFor,
}: CollectionFilterInput): CollectionFilters {
  // The rails answer "what have I had on lately" and "what am I still after",
  // so they are not narrowed by the filter chips — only by the search box, or
  // searching would leave two rails of non-matches at the top of the results.
  const playedRail = useMemo(() => {
    const rail = recentlyPlayed(albums, spins, 12);
    return searchQuery.trim() ? rail.filter((album) => albumMatchesSearchQuery(album, searchQuery)) : rail;
  }, [albums, spins, searchQuery]);

  const wishlistRail = useMemo(() => {
    const rail = albums
      .filter((album) => album.status === 'Wishlist' || album.status === 'Pre-order')
      .sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt))
      .slice(0, 20);
    return searchQuery.trim() ? rail.filter((album) => albumMatchesSearchQuery(album, searchQuery)) : rail;
  }, [albums, searchQuery]);

  const filtered = useMemo(() => {
    let result = albums;
    if (searchQuery.trim()) result = result.filter((album) => albumMatchesSearchQuery(album, searchQuery));
    result = result.filter((album) => matchesStatusFilter(album, statusFilter));
    result = result.filter((album) => matchesFormatFilter(album, selectedFormats));
    result = result.filter((album) => matchesArtistFilter(album, selectedArtists));
    result = result.filter((album) => matchesGenreFilter(album, selectedGenres));
    result = result.filter((album) => matchesYearFilter(album, selectedYears));
    return [...result].sort((a, b) => compareAlbums(a, b, sortBy, sortDir, { scoreFor }));
  }, [albums, searchQuery, statusFilter, selectedFormats, selectedArtists, selectedGenres, selectedYears, sortBy, sortDir, scoreFor]);

  const railIds = useMemo(() => {
    const ids = new Set<string>();
    // Only the wishlist rail claims its albums outright. A record you played
    // yesterday still belongs in the main grid — that rail is a shortcut, not a
    // section that owns rows.
    wishlistRail.forEach((album) => ids.add(album.id));
    return ids;
  }, [wishlistRail]);

  const mainAlbums = useMemo(
    () => (statusFilter === 'all' ? filtered.filter((album) => !railIds.has(album.id)) : filtered),
    [filtered, railIds, statusFilter],
  );

  const groups = useMemo(() => groupAlbums(mainAlbums, groupBy), [mainAlbums, groupBy]);

  // The spin picker draws from what is on the shelf and passes the filters —
  // "pick something from my jazz records" is exactly why filters exist — but a
  // wishlist entry can never be picked, because you cannot play it.
  const spinPool = useMemo(() => filtered.filter((album) => album.status === 'Collection'), [filtered]);

  return {
    recentlyPlayed: playedRail,
    wishlist: wishlistRail,
    mainAlbums,
    groups,
    spinPool,
    totalCount: albums.length,
    filteredCount: filtered.length,
  };
}
