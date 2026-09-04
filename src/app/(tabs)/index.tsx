import type { FlashListRef } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { AlbumGrid } from '@/components/media/AlbumGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import type { BottomSheetModal } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { CollectionFilterSheet } from '@/features/collection/CollectionFilterSheet';
import { CollectionGroups } from '@/features/collection/CollectionGroups';
import { CollectionSection } from '@/features/collection/CollectionSection';
import { CollectionToolbar } from '@/features/collection/CollectionToolbar';
import { GroupingSheet } from '@/features/collection/GroupingSheet';
import { useCollectionFilters } from '@/features/collection/useCollectionFilters';
import { useAlbumRatings } from '@/hooks/useAlbumRatings';
import { useAlbums } from '@/hooks/useAlbums';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { MAX_W } from '@/hooks/useResponsive';
import { useScrollToTopOnChange } from '@/hooks/useScrollToTopOnChange';
import { useSpins } from '@/hooks/useSpins';
import { useCollectionPrefs } from '@/store/collectionPrefs';
import { withTabReload } from '@/store/tabReload';
import type { Album } from '@/types/album';

/**
 * Your shelf. A thin composition layer: all derive logic lives in
 * useCollectionFilters, all durable prefs in the zustand+MMKV store, all
 * rendering in the Collection* components.
 *
 * Double-pressing the tab is "give me my collection back", so it clears the
 * persisted filters as well as the remount-scoped state (search, scroll). View
 * mode, card size, grouping and sort are deliberately left alone: those are how
 * you like to look at the shelf, not a narrowing you need undone.
 */
export default withTabReload(CollectionScreen, 'index', () => useCollectionPrefs.getState().resetFilters());

function CollectionScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { albums, loading, error } = useAlbums();
  const { spins, logSpin } = useSpins();
  const { ratingFor, scoreFor } = useAlbumRatings();
  const navBarSpace = useNavBarSpace();
  const [searchQuery, setSearchQuery] = useState('');

  const prefs = useCollectionPrefs();
  const filters = useCollectionFilters({
    albums,
    spins,
    searchQuery,
    statusFilter: prefs.statusFilter,
    selectedFormats: prefs.selectedFormats,
    selectedArtists: prefs.selectedArtists,
    selectedGenres: prefs.selectedGenres,
    selectedYears: prefs.selectedYears,
    sortBy: prefs.sortBy,
    sortDir: prefs.sortDir,
    groupBy: prefs.groupBy,
    scoreFor: useCallback((album: Album) => scoreFor(album.albumKey) ?? 0, [scoreFor]),
  });

  // Searching, filtering or re-sorting replaces what the list is showing, so it
  // goes back to the top instead of leaving the user parked at an offset that
  // now points into the middle of a different result set.
  const listRef = useScrollToTopOnChange<FlashListRef<Album>>(
    [
      searchQuery,
      prefs.statusFilter,
      prefs.sortBy,
      prefs.sortDir,
      prefs.groupBy,
      prefs.selectedFormats,
      prefs.selectedArtists,
      prefs.selectedGenres,
      prefs.selectedYears,
    ]
      .map((part) => (Array.isArray(part) ? part.join(',') : part))
      .join('|'),
  );

  const filterSheetRef = useRef<BottomSheetModal>(null);
  const groupingSheetRef = useRef<BottomSheetModal>(null);

  const openAlbum = (album: Album) => router.push({ pathname: '/album/[albumId]', params: { albumId: album.id } });
  const ratingsFor = (album: Album) => ratingFor(album.albumKey)?.ratings ?? null;

  const handleLogSpin = async (album: Album) => {
    try {
      await logSpin(album);
      show(`Spin logged for ${album.title}`);
    } catch (spinError) {
      show(spinError instanceof Error ? spinError.message : 'Could not log that spin');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenTop />
        <LoadingState label="Loading your collection…" />
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 bg-background">
        <ScreenTop />
        <ErrorState message={error instanceof Error ? error.message : 'Failed to load your collection'} />
      </View>
    );
  }

  const sections = (
    <>
      <CollectionSection
        title="Recently played"
        albums={filters.recentlyPlayed}
        ratingsFor={ratingsFor}
        onPress={openAlbum}
        onLogSpin={handleLogSpin}
        variant="cover"
      />
      <CollectionSection
        title="Wishlist"
        albums={filters.wishlist}
        ratingsFor={ratingsFor}
        onPress={openAlbum}
        variant="cover"
        collapsible
        collapsed={prefs.wishlistCollapsed}
        onToggleCollapse={prefs.toggleWishlistCollapsed}
      />
    </>
  );

  const emptyState =
    albums.length === 0 ? (
      <EmptyState title="Your shelf is empty" description="Tap + in the nav bar to add your first album." />
    ) : (
      <EmptyState title="Nothing matches" description="Loosen a filter or clear the search to see the rest." />
    );

  return (
    <View className="flex-1 bg-background">
      <ScreenTop />
      <ContentShell maxWidth={MAX_W.grid}>
        <CollectionToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenFilters={() => filterSheetRef.current?.present()}
          onOpenGrouping={() => groupingSheetRef.current?.present()}
        />
      </ContentShell>

      <ContentShell fill maxWidth={MAX_W.grid}>
        {filters.groups ? (
          // Grouped: one scroll view of buckets. The virtualized path below is
          // what carries a large ungrouped shelf.
          <ScrollView contentContainerStyle={{ paddingBottom: navBarSpace + 16 }} showsVerticalScrollIndicator={false}>
            {sections}
            <CollectionGroups
              groups={filters.groups}
              viewMode={prefs.viewMode}
              gridSize={prefs.gridSize}
              ratingsFor={ratingsFor}
              onPress={openAlbum}
              onLogSpin={handleLogSpin}
            />
          </ScrollView>
        ) : (
          <AlbumGrid
            listRef={listRef}
            albums={filters.mainAlbums}
            variant={prefs.viewMode === 'list' ? 'row' : 'cover'}
            size={prefs.gridSize}
            ratingsFor={ratingsFor}
            onPress={openAlbum}
            onLogSpin={handleLogSpin}
            ListHeaderComponent={sections}
            ListEmptyComponent={emptyState}
          />
        )}
      </ContentShell>

      <CollectionFilterSheet ref={filterSheetRef} />
      <GroupingSheet ref={groupingSheetRef} />
    </View>
  );
}
