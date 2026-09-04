import { View } from 'react-native';

import { AlbumCard } from '@/components/media/AlbumCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { columnsFor, gapForSize } from '@/components/media/AlbumGrid';
import { useMeasuredWidth } from '@/hooks/useResponsive';
import type { AlbumGroup } from '@/lib/collectionFacets';
import type { GridSize, ViewMode } from '@/store/collectionPrefs';
import type { Album, Ratings } from '@/types/album';

type CollectionGroupsProps = {
  groups: AlbumGroup[];
  viewMode: ViewMode;
  gridSize: GridSize;
  ratingsFor?: (album: Album) => Ratings | null;
  onPress: (album: Album) => void;
  onLogSpin?: (album: Album) => void;
  highlightedId?: string | null;
};

/**
 * The grouped view: a header per bucket, then that bucket's albums.
 *
 * Deliberately not virtualized — a FlashList per group nested in a ScrollView
 * measures against a parent that is still laying out, and each group is a
 * handful of rows anyway. Grouping is also mutually exclusive with the plain
 * grid (the screen renders one or the other), so the virtualized path is what
 * carries a large ungrouped collection.
 */
export function CollectionGroups({
  groups,
  viewMode,
  gridSize,
  ratingsFor,
  onPress,
  onLogSpin,
  highlightedId,
}: CollectionGroupsProps) {
  const { width, onLayout } = useMeasuredWidth();
  const isList = viewMode === 'list';
  const columns = isList ? 1 : columnsFor(gridSize, width);
  const halfGap = isList ? 6 : gapForSize(gridSize) / 2;

  return (
    <View className="gap-8" onLayout={onLayout}>
      {groups.map((group) => (
        <View key={group.title} className="gap-2">
          <SectionHeader title={group.title} count={group.albums.length} />
          <View className="flex-row flex-wrap" style={{ padding: halfGap }}>
            {group.albums.map((album) => (
              <View
                key={album.id}
                style={
                  isList
                    ? { width: '100%', paddingHorizontal: halfGap, paddingBottom: halfGap * 2 }
                    : { width: `${100 / columns}%`, padding: halfGap }
                }
              >
                <AlbumCard
                  album={album}
                  variant={isList ? 'row' : 'cover'}
                  ratings={ratingsFor?.(album) ?? null}
                  onPress={onPress}
                  onLogSpin={onLogSpin}
                  highlighted={highlightedId === album.id}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
