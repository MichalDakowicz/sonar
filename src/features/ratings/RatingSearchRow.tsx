import { Image } from 'expo-image';
import { Disc3, Star } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { personalScore } from '@/lib/personalScore';
import type { SpotifyAlbum } from '@/lib/spotify';
import { tierFor, tierMeta } from '@/lib/tiers';
import { artistsToDisplayString, releaseYear } from '@/lib/utils';
import { COLORS } from '@/theme/colors';
import type { Ratings } from '@/types/album';

type RatingSearchRowProps = {
  release: SpotifyAlbum;
  /** The rating already held against this release, if any. */
  ratings: Ratings | null;
  onPress: () => void;
};

/**
 * A search hit on the ratings page. No add-to-collection affordance anywhere on
 * it: this page is for rating records you have heard, whether or not you own
 * one, and offering to shelve them here is what made the old flow feel like
 * everything had to be collected first.
 */
export function RatingSearchRow({ release, ratings, onPress }: RatingSearchRowProps) {
  const score = personalScore(ratings);
  const tier = tierFor(score);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-2.5 active:opacity-80"
    >
      <View className="h-14 w-14 overflow-hidden rounded-md bg-secondary">
        {release.coverUrl ? (
          <Image source={{ uri: release.coverUrl }} style={{ width: 56, height: 56 }} contentFit="cover" transition={120} />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Disc3 size={20} color={COLORS.mutedDeep} />
          </View>
        )}
      </View>

      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-foreground">
          {release.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {[artistsToDisplayString(release.artist), releaseYear(release.releaseDate)].filter(Boolean).join(' • ')}
        </Text>
      </View>

      {tier ? (
        <View
          className="h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: tierMeta(tier).color }}
        >
          <Text className="text-base font-black text-black/80">{tierMeta(tier).label}</Text>
        </View>
      ) : (
        <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: COLORS.accentSoft }}>
          <Star size={16} color={COLORS.accent} />
        </View>
      )}
    </Pressable>
  );
}

export function SearchSpinner() {
  return (
    <View className="items-center py-8">
      <ActivityIndicator color={COLORS.accent} />
    </View>
  );
}
