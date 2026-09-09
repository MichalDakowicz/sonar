import { Star } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { SubjectArtwork } from '@/features/ratings/SubjectArtwork';
import { personalScore } from '@/lib/personalScore';
import { candidateByline, type RatingCandidate } from '@/lib/spotifySubjects';
import { tierFor, tierMeta } from '@/lib/tiers';
import { COLORS } from '@/theme/colors';
import type { Ratings } from '@/types/album';

type RatingSearchRowProps = {
  candidate: RatingCandidate;
  /** The rating already held against this subject, if any. */
  ratings: Ratings | null;
  onPress: () => void;
};

/**
 * A search hit on the ratings page — a release, a song or an artist.
 *
 * No add-to-collection affordance anywhere on it: this page is for rating what
 * you have heard, whether or not you own a copy, and two of the three subjects
 * cannot be shelved at all.
 */
export function RatingSearchRow({ candidate, ratings, onPress }: RatingSearchRowProps) {
  const score = personalScore(ratings);
  const tier = tierFor(score);
  const byline = candidateByline(candidate);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-2.5 active:opacity-80"
    >
      <SubjectArtwork subject={candidate.subject} uri={candidate.coverUrl} size={56} />

      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-foreground">
          {candidate.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {[byline, candidate.context].filter(Boolean).join(' • ')}
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
