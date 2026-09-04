import { forwardRef } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Sheet, type BottomSheetModal } from '@/components/ui/Sheet';
import { ChoiceRow } from '@/features/collection/FacetFilterRow';
import type { GroupBy } from '@/lib/collectionFacets';
import { useCollectionPrefs, type GridSize, type ViewMode } from '@/store/collectionPrefs';

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'artist', label: 'Artist' },
  { value: 'year', label: 'Year' },
  { value: 'genre', label: 'Genre' },
  { value: 'format', label: 'Format' },
  { value: 'status', label: 'Status' },
];

const SIZE_OPTIONS: { value: GridSize; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
];

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
];

/**
 * How the shelf is laid out, as opposed to what it is showing: grouping, card
 * size, grid or list. Split from the filter sheet because these are not
 * narrowings — clearing your filters should not reshuffle your view.
 */
export const GroupingSheet = forwardRef<BottomSheetModal>(function GroupingSheet(_props, ref) {
  const prefs = useCollectionPrefs();

  return (
    <Sheet ref={ref} snapPoints={['50%']} contentHeight={330}>
      <ScrollView contentContainerClassName="gap-6 p-4">
        <Text className="text-lg font-bold text-foreground">View</Text>
        <ChoiceRow title="Group by" options={GROUP_OPTIONS} value={prefs.groupBy} onChange={prefs.setGroupBy} />
        <ChoiceRow title="Layout" options={VIEW_OPTIONS} value={prefs.viewMode} onChange={prefs.setViewMode} />
        <ChoiceRow title="Card size" options={SIZE_OPTIONS} value={prefs.gridSize} onChange={prefs.setGridSize} />
        <View className="pb-2">
          <Text className="text-xs text-muted-foreground">
            Grouping and hand-sorting are mutually exclusive — drag to reorder needs the ungrouped shelf.
          </Text>
        </View>
      </ScrollView>
    </Sheet>
  );
});
