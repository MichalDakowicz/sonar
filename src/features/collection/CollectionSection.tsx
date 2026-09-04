import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AlbumCard } from '@/components/media/AlbumCard';
import { AlbumCarousel } from '@/components/media/AlbumCarousel';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useMeasuredWidth } from '@/hooks/useResponsive';
import { COLORS } from '@/theme/colors';
import type { Album, Ratings } from '@/types/album';

// A 16:9 banner that keeps growing with the viewport turns into a billboard on
// a desktop monitor; past this the card stops scaling and the row just fits more.
const MAX_FEATURED_WIDTH = 760;

type CollectionSectionProps = {
  title: string;
  albums: Album[];
  ratingsFor?: (album: Album) => Ratings | null;
  onPress: (album: Album) => void;
  onLogSpin?: (album: Album) => void;
  highlightedId?: string | null;
  /** Featured banners for a short rail, cover tiles for a long one. */
  variant?: 'featured' | 'cover';
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

/**
 * One rail above the main grid (Recently played, Wishlist). A lone album
 * renders as a plain full-width banner; two or more go through the carousel,
 * shrunk a touch so the next one peeks in and the row reads as scrollable.
 */
export function CollectionSection({
  title,
  albums,
  ratingsFor,
  onPress,
  onLogSpin,
  highlightedId,
  variant = 'featured',
  collapsible,
  collapsed,
  onToggleCollapse,
}: CollectionSectionProps) {
  const { width, onLayout } = useMeasuredWidth();
  if (albums.length === 0) return null;

  const Chevron = collapsed ? ChevronDown : ChevronUp;
  const action = collapsible ? (
    <Pressable onPress={onToggleCollapse} hitSlop={10} accessibilityLabel={`Toggle ${title}`} className="p-1 active:opacity-70">
      <Chevron size={20} color={COLORS.muted} />
    </Pressable>
  ) : undefined;

  return (
    <View className="gap-2 pb-8 pt-2" onLayout={onLayout}>
      <SectionHeader title={title} count={albums.length} action={action} />
      {!collapsed &&
        (variant === 'featured' && albums.length === 1 ? (
          <View className="px-4" style={{ maxWidth: MAX_FEATURED_WIDTH }}>
            <AlbumCard
              album={albums[0]}
              variant="featured"
              ratings={ratingsFor?.(albums[0]) ?? null}
              onPress={onPress}
              onLogSpin={onLogSpin}
              highlighted={highlightedId === albums[0].id}
            />
          </View>
        ) : (
          <AlbumCarousel
            albums={albums}
            cardVariant={variant}
            cardWidth={variant === 'featured' ? Math.min(MAX_FEATURED_WIDTH, width - 64) : undefined}
            ratingsFor={ratingsFor}
            onPress={onPress}
            onLogSpin={onLogSpin}
            highlightedId={highlightedId}
          />
        ))}
    </View>
  );
}
