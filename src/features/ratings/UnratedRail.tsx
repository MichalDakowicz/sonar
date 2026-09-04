import { Image } from 'expo-image';
import { Disc3 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { isOwned } from '@/lib/albumStatus';
import { artistsToDisplayString } from '@/lib/utils';
import { COLORS } from '@/theme/colors';
import type { Album, AlbumRating } from '@/types/album';
import type { RateTarget } from '@/hooks/useAlbumRatings';

const COVER = 96;
const LIMIT = 24;

type UnratedRailProps = {
  albums: Album[];
  ratingFor: (albumKey: string | null | undefined) => AlbumRating | null;
  onPick: (target: RateTarget) => void;
};

/**
 * Records you own and have never scored — the obvious next thing to rate, and
 * the only place on this page where the collection is consulted at all.
 *
 * Newest first: what you bought last week is what you have an opinion about.
 * Hidden entirely once the shelf is fully rated, rather than left as a
 * permanently empty row.
 */
export function UnratedRail({ albums, ratingFor, onPick }: UnratedRailProps) {
  const unrated = useMemo(
    () =>
      albums
        .filter((album) => isOwned(album) && !ratingFor(album.albumKey))
        .sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt))
        .slice(0, LIMIT),
    [albums, ratingFor],
  );

  if (unrated.length === 0) return null;

  return (
    <View className="gap-2 pt-2">
      <SectionHeader title="On your shelf, unrated" count={unrated.length} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4">
        {unrated.map((album) => (
          <Pressable
            key={album.id}
            onPress={() =>
              onPick({
                albumKey: album.albumKey,
                spotifyId: album.spotifyId,
                title: album.title,
                artist: album.artist,
                coverUrl: album.coverUrl,
                releaseDate: album.releaseDate,
              })
            }
            className="active:opacity-70"
            style={{ width: COVER }}
          >
            <View className="overflow-hidden rounded-md bg-neutral-900" style={{ width: COVER, height: COVER }}>
              {album.coverUrl ? (
                <Image
                  source={{ uri: album.coverUrl }}
                  style={{ width: COVER, height: COVER }}
                  contentFit="cover"
                  transition={120}
                  cachePolicy="memory-disk"
                  recyclingKey={album.coverUrl}
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Disc3 size={26} color={COLORS.mutedDeep} />
                </View>
              )}
            </View>
            <Text numberOfLines={1} className="pt-1 text-[11px] font-semibold text-foreground">
              {album.title}
            </Text>
            <Text numberOfLines={1} className="text-[10px] text-muted-foreground">
              {artistsToDisplayString(album.artist)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
