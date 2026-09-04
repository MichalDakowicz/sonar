import { LinearGradient } from 'expo-linear-gradient';
import { Play, Plus, StickyNote } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/media/CoverImage';
import { FormatBadges, FormatLine, StatusBadge } from '@/components/media/FormatBadges';
import { RatingStars, ScoreBadge } from '@/components/media/RatingStars';
import { useHover, webTransition } from '@/hooks/useResponsive';
import { artistsToDisplayString, cn, formatRelativeTime, releaseYear } from '@/lib/utils';
import { COLORS } from '@/theme/colors';
import type { Album, Ratings } from '@/types/album';

// The single card every screen routes covers through — model differences as
// variants and props here, never as a second copy of the markup.
export type AlbumCardVariant = 'cover' | 'row' | 'featured' | 'compact';

export type AlbumCardProps = {
  album: Album;
  variant?: AlbumCardVariant;
  /** The user's own rating for this release, looked up by album key. */
  ratings?: Ratings | null;
  onPress?: (album: Album) => void;
  /** Log a listen straight from the card — the legacy "spin" button. */
  onLogSpin?: (album: Album) => void;
  /** Discover: add a release the shelf does not have yet. */
  onAdd?: (album: Album) => void;
  isAdded?: boolean;
  highlighted?: boolean;
  readOnly?: boolean;
  /** Cover crossfade length. 0 for rapid source swaps (the spin reel). */
  coverTransitionMs?: number;
};

// Memoized: rendered in every FlashList cell (grid + carousels). Without this a
// parent re-render — a filter change, a theme swap — re-renders every mounted
// card even when its own props are unchanged.
export const AlbumCard = memo(AlbumCardImpl);

function AlbumCardImpl(props: AlbumCardProps) {
  switch (props.variant) {
    case 'row':
      return <RowCard {...props} />;
    case 'featured':
      return <FeaturedCard {...props} />;
    case 'compact':
      return <CompactCard {...props} />;
    default:
      return <CoverCard {...props} />;
  }
}

/** Anything you do not actually own reads as dimmed. */
function isDimmed(album: Album) {
  return album.status !== 'Collection';
}

function CoverCard({
  album,
  ratings,
  onPress,
  onLogSpin,
  onAdd,
  isAdded = false,
  highlighted = false,
  readOnly = false,
  coverTransitionMs,
}: AlbumCardProps) {
  const artist = artistsToDisplayString(album.artist);
  const year = releaseYear(album.releaseDate);
  const { hovered, bind } = useHover();
  const canAdd = !!onAdd && !isAdded;

  return (
    // zIndex so the hover lift renders over its neighbours instead of under them.
    <View className="gap-1.5" style={hovered ? { zIndex: 10 } : undefined}>
      <Pressable
        {...bind}
        onPress={() => onPress?.(album)}
        // Square, not 2:3: album art is square, and a poster crop would cut the
        // sleeve. This is the one shape difference from Radar's card.
        className="relative aspect-square overflow-hidden rounded-md bg-neutral-900"
        style={[
          { cursor: 'pointer' },
          webTransition('transform'),
          highlighted ? { borderWidth: 2, borderColor: COLORS.accent } : null,
          hovered ? { transform: [{ scale: 1.035 }] } : null,
        ]}
      >
        <CoverImage uri={album.coverUrl} dimmed={isDimmed(album)} transitionMs={coverTransitionMs} />
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'transparent']}
          locations={[0, 0.3, 0.6]}
          style={StyleSheet.absoluteFill}
        />

        {/* On a phone the grid shows no title (no room, and a tap is cheap);
            with a mouse the title is what you want before clicking. */}
        {hovered && (
          <>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              locations={[0.4, 1]}
              style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
            />
            <View className="absolute inset-x-0 bottom-0 p-2.5 pr-11" style={{ pointerEvents: 'none' }}>
              <Text numberOfLines={2} className="text-xs font-semibold leading-tight text-white">
                {album.title}
              </Text>
              {!!artist && (
                <Text numberOfLines={1} className="text-[10px] text-neutral-300">
                  {artist}
                </Text>
              )}
            </View>
          </>
        )}

        <View className="absolute inset-x-0 top-0 flex-row items-start justify-between gap-1.5 p-2">
          <View className="flex-row items-center gap-1">
            <StatusBadge status={album.status} />
            <FormatBadges formats={album.formats} />
          </View>
          {!!year && <Text className="text-[10px] font-medium text-neutral-300">{year}</Text>}
        </View>

        {!readOnly && !!onLogSpin && album.status === 'Collection' && (
          <Pressable
            onPress={() => onLogSpin(album)}
            accessibilityLabel={`Log a listen of ${album.title}`}
            className="absolute bottom-2 right-2 rounded-full bg-primary/90 p-2"
          >
            <Play size={12} color="#fff" fill="#fff" />
          </Pressable>
        )}
        {!readOnly && canAdd && (
          <Pressable
            onPress={() => onAdd?.(album)}
            accessibilityLabel={`Add ${album.title}`}
            className="absolute bottom-2 right-2 rounded-full bg-primary/90 p-2"
          >
            <Plus size={12} color="#fff" />
          </Pressable>
        )}
        {!readOnly && !!album.notes && (
          <View className="absolute bottom-2 left-2 rounded-full bg-neutral-800/90 p-1.5">
            <StickyNote size={12} color="#d4d4d4" />
          </View>
        )}
      </Pressable>

      <View className="flex-row items-center justify-between gap-1 px-0.5">
        <RatingStars ratings={ratings} size={10} />
        {!!album.lastListenedAt && (
          <Text className="text-[10px] text-muted-foreground">{formatRelativeTime(album.lastListenedAt)}</Text>
        )}
      </View>
    </View>
  );
}

function RowCard({ album, ratings, onPress, onLogSpin, highlighted = false, readOnly = false }: AlbumCardProps) {
  const artist = artistsToDisplayString(album.artist);
  const year = releaseYear(album.releaseDate);
  const { hovered, bind } = useHover();

  return (
    <Pressable
      {...bind}
      onPress={() => onPress?.(album)}
      style={[{ cursor: 'pointer' }, webTransition('background-color'), hovered ? { backgroundColor: 'hsl(0 0% 16%)' } : null]}
      className={cn(
        'flex-row items-center gap-3 rounded-xl border-l-4 p-3',
        highlighted ? 'border-l-primary bg-neutral-800' : 'border-l-transparent bg-neutral-900',
      )}
    >
      <View className="h-16 w-16 overflow-hidden rounded-md bg-neutral-800">
        <CoverImage uri={album.coverUrl} dimmed={isDimmed(album)} iconSize={20} />
      </View>

      <View className="min-w-0 flex-1 gap-1">
        <Text numberOfLines={1} className="text-base font-bold text-foreground">
          {album.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {[artist, year].filter(Boolean).join(' • ')}
        </Text>
        <View className="flex-row items-center gap-2">
          <FormatLine formats={album.formats} />
          <RatingStars ratings={ratings} size={10} />
        </View>
      </View>

      <View className="items-end gap-1">
        <StatusBadge status={album.status} size={15} />
        {!readOnly && !!onLogSpin && album.status === 'Collection' && (
          <Pressable
            onPress={() => onLogSpin(album)}
            accessibilityLabel={`Log a listen of ${album.title}`}
            hitSlop={8}
            className="rounded-full bg-primary/15 p-2"
          >
            <Play size={14} color={COLORS.accent} fill={COLORS.accent} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

/**
 * Wide banner for the collection's own sections (Recently played, Wishlist).
 * Crops the square cover to 16:9 on purpose: a row of square cards at full
 * width reads as a list of tiles, and the banner is what makes a section feel
 * like a shelf rather than more grid.
 */
function FeaturedCard({ album, ratings, onPress, onLogSpin, highlighted = false, readOnly = false }: AlbumCardProps) {
  const artist = artistsToDisplayString(album.artist);
  const played = formatRelativeTime(album.lastListenedAt);

  return (
    <Pressable
      onPress={() => onPress?.(album)}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900"
      style={[{ cursor: 'pointer' }, highlighted ? { borderWidth: 2, borderColor: COLORS.accent } : null]}
    >
      <CoverImage uri={album.coverUrl} dimmed={isDimmed(album)} iconSize={40} />
      {/* Left veil anchors the text, bottom veil keeps the meta legible. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.15)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} locations={[0.4, 1]} style={StyleSheet.absoluteFill} />

      <View className="absolute inset-x-0 top-0 flex-row items-start justify-between p-3">
        <View className="flex-row items-center gap-1">
          <StatusBadge status={album.status} />
          <FormatBadges formats={album.formats} />
        </View>
        <ScoreBadge ratings={ratings} />
      </View>

      <View className="absolute inset-x-0 bottom-0 gap-1 px-4 pb-4">
        <Text numberOfLines={1} className="text-xl font-bold leading-tight text-white">
          {album.title}
        </Text>
        <View className="flex-row items-center gap-2">
          {!!artist && (
            <Text numberOfLines={1} className="flex-1 text-xs text-neutral-300">
              {artist}
            </Text>
          )}
          {!!played && <Text className="text-[11px] text-neutral-400">{played}</Text>}
        </View>
      </View>

      {!readOnly && !!onLogSpin && album.status === 'Collection' && (
        <Pressable
          onPress={() => onLogSpin(album)}
          accessibilityLabel={`Log a listen of ${album.title}`}
          className="absolute bottom-4 right-4 rounded-full bg-primary p-3"
        >
          <Play size={16} color="#fff" fill="#fff" />
        </Pressable>
      )}
    </Pressable>
  );
}

function CompactCard({ album, ratings, onPress, highlighted = false }: AlbumCardProps) {
  const { hovered, bind } = useHover();

  return (
    <Pressable
      {...bind}
      onPress={() => onPress?.(album)}
      className="relative aspect-square overflow-hidden rounded-md bg-neutral-900"
      style={[
        { cursor: 'pointer' },
        webTransition('transform'),
        highlighted ? { borderWidth: 2, borderColor: COLORS.accent } : null,
        hovered ? { transform: [{ scale: 1.04 }], zIndex: 10 } : null,
      ]}
    >
      <CoverImage uri={album.coverUrl} dimmed={isDimmed(album)} iconSize={22} />
      <View className="absolute left-1.5 top-1.5 flex-row items-center gap-1">
        <StatusBadge status={album.status} size={11} />
        <ScoreBadge ratings={ratings} />
      </View>
      <View className="absolute inset-x-0 bottom-0 bg-black/65 px-1.5 py-1">
        <Text numberOfLines={1} className="text-[11px] font-semibold text-white">
          {album.title}
        </Text>
      </View>
    </Pressable>
  );
}
