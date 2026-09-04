import { forwardRef, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Sheet, type BottomSheetModal } from '@/components/ui/Sheet';
import { ChoiceRow, FacetFilterRow } from '@/features/collection/FacetFilterRow';
import { useAlbums } from '@/hooks/useAlbums';
import { collectionFacets } from '@/lib/collectionFacets';
import { SORT_OPTIONS } from '@/lib/collectionSort';
import { useCollectionPrefs, type StatusFilter } from '@/store/collectionPrefs';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Collection', label: 'Collection' },
  { value: 'Wishlist', label: 'Wishlist' },
  { value: 'Pre-order', label: 'Pre-order' },
];

/**
 * Every way to narrow the collection, in one sheet: status, format, artist,
 * genre, year, then sort. The legacy web app spread these across a popover, a
 * combobox and a second popover; as one sheet they narrow the single
 * virtualized grid instead of re-bucketing it.
 */
export const CollectionFilterSheet = forwardRef<BottomSheetModal>(function CollectionFilterSheet(_props, ref) {
  const prefs = useCollectionPrefs();
  const { albums } = useAlbums();
  const facets = useMemo(() => collectionFacets(albums), [albums]);
  // Chips plus labels come to a fixed height, so the sheet is sized to what it
  // measures rather than to a fraction of the screen. The snap point stays as
  // the ceiling for narrow screens where the chips wrap onto more rows, and the
  // starting estimate keeps the first open from visibly resizing once measured.
  const [contentHeight, setContentHeight] = useState(470);

  return (
    <Sheet ref={ref} snapPoints={['80%']} contentHeight={contentHeight}>
      <ScrollView contentContainerClassName="gap-6 p-4" onContentSizeChange={(_width, height) => setContentHeight(height)}>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-foreground">Filter &amp; Sort</Text>
          <Pressable onPress={prefs.resetFilters} hitSlop={8}>
            <Text className="text-sm text-muted-foreground">Clear all</Text>
          </Pressable>
        </View>

        <ChoiceRow title="Status" options={STATUS_OPTIONS} value={prefs.statusFilter} onChange={prefs.setStatusFilter} />

        <FacetFilterRow title="Format" facets={facets.formats} selected={prefs.selectedFormats} onToggle={prefs.toggleFormat} />

        <FacetFilterRow
          title="Artist"
          facets={facets.artists}
          selected={prefs.selectedArtists}
          onToggle={prefs.toggleArtist}
          searchPlaceholder="Search artists…"
        />

        <FacetFilterRow title="Genre" facets={facets.genres} selected={prefs.selectedGenres} onToggle={prefs.toggleGenre} />

        <FacetFilterRow title="Release year" facets={facets.years} selected={prefs.selectedYears} onToggle={prefs.toggleYear} />

        <ChoiceRow title="Sort by" options={SORT_OPTIONS} value={prefs.sortBy} onChange={prefs.setSortBy} />
      </ScrollView>
    </Sheet>
  );
});
