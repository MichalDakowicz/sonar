import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { AlbumCard, type AlbumCardVariant } from '@/components/media/AlbumCard';
import { useIsDesktop, useMeasuredWidth } from '@/hooks/useResponsive';
import type { Album, Ratings } from '@/types/album';

// Horizontal row of cards — the section primitive used everywhere a shelf runs
// sideways (Recently played, Wishlist, a friend's rails, Discover rows).
//
// Deliberately not virtualized: every caller caps its row at a couple of dozen
// items, and a FlashList mounted inside another list's header can settle at one
// visible card until something forces it to measure again — which is exactly
// the moment a freshly added album lands in the row.
type AlbumCarouselProps = {
  title?: string;
  badge?: string;
  albums: Album[];
  cardVariant?: AlbumCardVariant;
  cardWidth?: number;
  ratingsFor?: (album: Album) => Ratings | null;
  onPress?: (album: Album) => void;
  onLogSpin?: (album: Album) => void;
  onAdd?: (album: Album) => void;
  isAdded?: (album: Album) => boolean;
  highlightedId?: string | null;
  readOnly?: boolean;
};

const GAP = 16;
const EDGE_PADDING = 16;

export function AlbumCarousel({
  title,
  badge,
  albums,
  cardVariant = 'cover',
  cardWidth,
  ratingsFor,
  onPress,
  onLogSpin,
  onAdd,
  isAdded,
  highlightedId,
  readOnly,
}: AlbumCarouselProps) {
  const isDesktop = useIsDesktop();
  const { width: rowWidth, onLayout } = useMeasuredWidth();
  const [offset, setOffset] = useState(0);

  if (albums.length === 0) return null;

  // Featured banners page one at a time; cover rows scroll freely. Covers can
  // afford to be bigger with a mouse — 132px is a thumb-sized target.
  const isFeatured = cardVariant === 'featured';
  const itemWidth = cardWidth ?? (isDesktop ? 168 : 132);
  const snapInterval = isFeatured ? itemWidth + GAP : undefined;
  const contentWidth = albums.length * (itemWidth + GAP) - GAP + EDGE_PADDING * 2;
  const scrollable = contentWidth > rowWidth + 4 && offset + rowWidth < contentWidth - 4;

  return (
    <View className="gap-3">
      {!!title && (
        <View className="flex-row items-center gap-2 px-4">
          <Text className="text-xl font-semibold text-foreground">{title}</Text>
          {!!badge && (
            <View className="rounded-full bg-primary/20 px-2 py-0.5">
              <Text className="text-xs font-medium text-primary">{badge}</Text>
            </View>
          )}
        </View>
      )}

      <View className="relative" onLayout={onLayout}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: EDGE_PADDING }}
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate={isFeatured ? 'fast' : 'normal'}
          scrollEventThrottle={16}
          onScroll={({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => setOffset(nativeEvent.contentOffset.x)}
        >
          {albums.map((album, index) => (
            <View key={album.id} style={{ width: itemWidth, marginRight: index === albums.length - 1 ? 0 : GAP }}>
              <AlbumCard
                album={album}
                variant={cardVariant}
                ratings={ratingsFor?.(album) ?? null}
                onPress={onPress}
                onLogSpin={onLogSpin}
                onAdd={onAdd}
                isAdded={isAdded?.(album)}
                highlighted={highlightedId === album.id}
                readOnly={readOnly}
              />
            </View>
          ))}
        </ScrollView>

        {/* Right-edge fade: the cue that this row scrolls, without tracking a
            live scroll offset the way hover-only arrows would need to. */}
        {scrollable && !isFeatured && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 44, pointerEvents: 'none' }}
          />
        )}
      </View>
    </View>
  );
}
