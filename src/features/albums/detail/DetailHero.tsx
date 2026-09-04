import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverImage } from '@/components/media/CoverImage';
import { RatingStars } from '@/components/media/RatingStars';
import { artistsToDisplayString, formatReleaseDate, goBackOrHome } from '@/lib/utils';
import type { Ratings } from '@/types/album';

type DetailHeroProps = {
  title: string;
  artist: string[];
  coverUrl: string | null;
  releaseDate: string | null;
  releaseDatePrecision?: string | null;
  totalTracks?: number | null;
  ratings?: Ratings | null;
  /** The primary CTA — add to shelf, or the owned-state menu. */
  action?: ReactNode;
};

/**
 * The top of a release page: the sleeve behind a veil, the facts in front of
 * it, and one action. The cover doubles as the backdrop because an album has no
 * separate wide art — blurring the same square is what every music app does,
 * and it keeps a release with no artwork from looking broken.
 */
export function DetailHero({
  title,
  artist,
  coverUrl,
  releaseDate,
  releaseDatePrecision,
  totalTracks,
  ratings,
  action,
}: DetailHeroProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const meta = [formatReleaseDate(releaseDate, releaseDatePrecision), totalTracks ? `${totalTracks} tracks` : '']
    .filter(Boolean)
    .join(' • ');

  return (
    <View className="relative">
      <View className="absolute inset-0 overflow-hidden">
        <CoverImage uri={coverUrl} iconSize={64} />
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'rgba(9,9,11,0.85)', 'rgb(9,9,11)']}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={{ paddingTop: insets.top + 8 }} className="px-4 pb-5">
        <Pressable
          onPress={() => goBackOrHome(router)}
          accessibilityLabel="Back"
          className="h-11 w-11 items-center justify-center rounded-full bg-black/45 active:opacity-70"
        >
          <ChevronLeft size={24} color="#fff" />
        </Pressable>

        <View className="flex-row items-end gap-4 pt-6">
          <View className="h-32 w-32 overflow-hidden rounded-lg bg-neutral-900 shadow-2xl">
            <CoverImage uri={coverUrl} iconSize={30} />
          </View>
          <View className="min-w-0 flex-1 gap-1.5 pb-1">
            <Text numberOfLines={3} className="text-2xl font-bold leading-tight text-white">
              {title}
            </Text>
            {artist.length > 0 && (
              <Text numberOfLines={2} className="text-sm font-medium text-neutral-300">
                {artistsToDisplayString(artist)}
              </Text>
            )}
            {!!meta && <Text className="text-xs text-neutral-400">{meta}</Text>}
            <RatingStars ratings={ratings} size={13} />
          </View>
        </View>

        {!!action && <View className="pt-5">{action}</View>}
      </View>
    </View>
  );
}
