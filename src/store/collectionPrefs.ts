import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GridSize } from '@/components/media/AlbumGrid';
import { SORT_DEFAULT_DIR, type SortBy, type SortDir } from '@/lib/collectionSort';
import type { GroupBy } from '@/lib/collectionFacets';
import { mmkvStorage } from '@/lib/mmkvStorage';
import type { AlbumStatus } from '@/types/album';

// Durable collection prefs: view mode, grid size, group-by, filters and sort
// are how you like to look at your shelf, so they survive a restart. Search
// text and scroll position stay remount-scoped and are never persisted here.
export type ViewMode = 'grid' | 'list';
export type StatusFilter = AlbumStatus | 'all';
export type { GridSize, GroupBy, SortBy, SortDir };

type CollectionPrefsState = {
  viewMode: ViewMode;
  gridSize: GridSize;
  groupBy: GroupBy;
  sortBy: SortBy;
  sortDir: SortDir;
  statusFilter: StatusFilter;
  selectedFormats: string[];
  selectedArtists: string[];
  selectedGenres: string[];
  selectedYears: string[];
  wishlistCollapsed: boolean;
  setViewMode: (viewMode: ViewMode) => void;
  setGridSize: (gridSize: GridSize) => void;
  setGroupBy: (groupBy: GroupBy) => void;
  setSortBy: (sortBy: SortBy) => void;
  toggleSortDir: () => void;
  setStatusFilter: (statusFilter: StatusFilter) => void;
  toggleFormat: (format: string) => void;
  toggleArtist: (artist: string) => void;
  toggleGenre: (genre: string) => void;
  toggleYear: (year: string) => void;
  toggleWishlistCollapsed: () => void;
  resetFilters: () => void;
};

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export const useCollectionPrefs = create<CollectionPrefsState>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      gridSize: 'normal',
      groupBy: 'none',
      // Shelf order is the default because the legacy app's default was its
      // drag-to-reorder order, and an existing collection must open looking the
      // way it was left.
      sortBy: 'custom',
      sortDir: SORT_DEFAULT_DIR.custom,
      statusFilter: 'all',
      selectedFormats: [],
      selectedArtists: [],
      selectedGenres: [],
      selectedYears: [],
      wishlistCollapsed: false,
      setViewMode: (viewMode) => set({ viewMode }),
      setGridSize: (gridSize) => set({ gridSize }),
      setGroupBy: (groupBy) => set({ groupBy }),
      // Picking a sort resets direction to that sort's natural one (newest,
      // highest, most recently played first); the arrow flips it from there.
      setSortBy: (sortBy) => set({ sortBy, sortDir: SORT_DEFAULT_DIR[sortBy] }),
      toggleSortDir: () => set((state) => ({ sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' })),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      toggleFormat: (format) => set((state) => ({ selectedFormats: toggleIn(state.selectedFormats, format) })),
      toggleArtist: (artist) => set((state) => ({ selectedArtists: toggleIn(state.selectedArtists, artist) })),
      toggleGenre: (genre) => set((state) => ({ selectedGenres: toggleIn(state.selectedGenres, genre) })),
      toggleYear: (year) => set((state) => ({ selectedYears: toggleIn(state.selectedYears, year) })),
      toggleWishlistCollapsed: () => set((state) => ({ wishlistCollapsed: !state.wishlistCollapsed })),
      resetFilters: () =>
        set({
          statusFilter: 'all',
          selectedFormats: [],
          selectedArtists: [],
          selectedGenres: [],
          selectedYears: [],
        }),
    }),
    {
      name: 'collection-prefs',
      storage: createJSONStorage(() => mmkvStorage),
      version: 1,
    },
  ),
);

/** How many dimensions are narrowed — the badge on the filter button. */
export function activeFilterCount(state: Pick<CollectionPrefsState, 'statusFilter' | 'selectedFormats' | 'selectedArtists' | 'selectedGenres' | 'selectedYears'>): number {
  return (
    (state.statusFilter !== 'all' ? 1 : 0) +
    (state.selectedFormats.length > 0 ? 1 : 0) +
    (state.selectedArtists.length > 0 ? 1 : 0) +
    (state.selectedGenres.length > 0 ? 1 : 0) +
    (state.selectedYears.length > 0 ? 1 : 0)
  );
}
