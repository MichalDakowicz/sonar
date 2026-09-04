import { FlashList, type FlashListRef } from '@shopify/flash-list';
import type { ReactElement, RefObject } from 'react';
import { View } from 'react-native';

import { AlbumCard, type AlbumCardVariant } from '@/components/media/AlbumCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { BREAKPOINTS, useMeasuredWidth } from '@/hooks/useResponsive';
import type { Album, Ratings } from '@/types/album';

// The three size presets, ported from the legacy web app's gridClasses. Album
// art is square, so a row fits one more column than Radar's poster grid does at
// the same width.
export type GridSize = 'compact' | 'normal' | 'large';

type ColumnSteps = { base: number; sm?: number; md?: number; lg?: number; xl?: number; '2xl'?: number; '3xl'?: number; '4xl'?: number };

const COLUMN_TABLE: Record<GridSize, ColumnSteps> = {
  compact: { base: 3, sm: 4, md: 5, lg: 7, xl: 8, '2xl': 10, '3xl': 12, '4xl': 14 },
  normal: { base: 2, md: 3, lg: 5, xl: 6, '2xl': 7, '3xl': 9, '4xl': 10 },
  large: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6, '3xl': 7, '4xl': 8 },
};

// Widest first: the first step the container is at least as wide as wins.
const STEPS = ['4xl', '3xl', '2xl', 'xl', 'lg', 'md', 'sm'] as const;

/**
 * Column count for a grid `width` *of the grid itself*, not of the window —
 * callers on desktop pass a measured width, since the centred content cap can
 * take hundreds of pixels off the window.
 */
export function columnsFor(size: GridSize, width: number): number {
  const table = COLUMN_TABLE[size];
  for (const step of STEPS) {
    const columns = table[step];
    if (columns && width >= BREAKPOINTS[step]) return columns;
  }
  return table.base;
}

/** Legacy gap values: compact 16px, normal/large 24px. */
export function gapForSize(size: GridSize): number {
  return size === 'compact' ? 16 : 24;
}

type AlbumGridProps = {
  albums: Album[];
  size?: GridSize;
  variant?: AlbumCardVariant;
  /** Rating lookup by album key — the card shows the user's own score. */
  ratingsFor?: (album: Album) => Ratings | null;
  onPress?: (album: Album) => void;
  onLogSpin?: (album: Album) => void;
  onAdd?: (album: Album) => void;
  isAdded?: (album: Album) => boolean;
  highlightedId?: string | null;
  readOnly?: boolean;
  /** Leaves room for the floating nav. Off inside another scroll container. */
  padForNavBar?: boolean;
  ListHeaderComponent?: ReactElement;
  ListFooterComponent?: ReactElement;
  ListEmptyComponent?: ReactElement;
  listRef?: RefObject<FlashListRef<Album> | null>;
  onEndReached?: () => void;
};

/**
 * The one virtualized container for a wall of covers: the collection in grid or
 * list view, Discover's results, a friend's shelf. One list for both view modes
 * (`variant` picks the card), so there is no second copy of the layout maths.
 */
export function AlbumGrid({
  albums,
  size = 'normal',
  variant = 'cover',
  ratingsFor,
  onPress,
  onLogSpin,
  onAdd,
  isAdded,
  highlightedId,
  readOnly,
  padForNavBar = true,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  listRef,
  onEndReached,
}: AlbumGridProps) {
  // Measured, not window width: on desktop the centred content column makes the
  // window much wider than this list actually gets.
  const { width, onLayout } = useMeasuredWidth();
  const navBarSpace = useNavBarSpace();
  const isList = variant === 'row';
  const columns = isList ? 1 : columnsFor(size, width);
  // Half-gap padding on both the item and the container, so edge gaps match
  // inter-card gaps.
  const halfGap = isList ? 6 : gapForSize(size) / 2;
  const bottomPad = halfGap + (padForNavBar ? navBarSpace : 0);

  return (
    <View className="flex-1" onLayout={onLayout}>
      <FlashList
        ref={listRef}
        key={`grid-${variant}-${columns}-${size}`}
        // Off by default in FlashList v2 terms: anchoring the visible item is
        // for chat, where new rows arrive above what you are reading. Here the
        // data changes because the user re-filtered, and holding their old
        // offset is precisely what strands them mid-list.
        maintainVisibleContentPosition={{ disabled: true }}
        data={albums}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: halfGap, paddingBottom: bottomPad }}
        ListHeaderComponent={
          // Cancel the container padding so full-bleed headers reach the screen
          // edges instead of being framed by a halfGap border.
          ListHeaderComponent ? (
            <View style={{ marginHorizontal: -halfGap, marginTop: -halfGap }}>{ListHeaderComponent}</View>
          ) : undefined
        }
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={
          ListEmptyComponent ?? <EmptyState title="Nothing here yet" description="Add an album to start your shelf." />
        }
        onEndReached={onEndReached}
        renderItem={({ item }) => (
          <View style={isList ? { paddingHorizontal: halfGap, paddingBottom: halfGap * 2 } : { flex: 1, padding: halfGap }}>
            <AlbumCard
              album={item}
              variant={variant}
              ratings={ratingsFor?.(item) ?? null}
              onPress={onPress}
              onLogSpin={onLogSpin}
              onAdd={onAdd}
              isAdded={isAdded?.(item)}
              highlighted={highlightedId === item.id}
              readOnly={readOnly}
            />
          </View>
        )}
      />
    </View>
  );
}
