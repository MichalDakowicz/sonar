import { Star } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { personalScore } from '@/lib/personalScore';
import { COLORS } from '@/theme/colors';
import type { Ratings } from '@/types/album';

// The scoring rule lives in lib/personalScore so non-React callers (the stats
// builders, the migration script) can use it. Re-exported here because most
// call sites reach for it alongside the stars.
export { personalScore };

type RatingStarsProps = {
  ratings?: Ratings | null;
  size?: number;
  /** Renders a dim outline when there is no score, instead of nothing. */
  showEmpty?: boolean;
};

/**
 * Five stars filled to a 0–5 score, with the number beside them. Partial fill
 * is a clipped overlay rather than a half-star glyph, so 4.3 reads as 4.3.
 */
export function RatingStars({ ratings, size = 12, showEmpty = false }: RatingStarsProps) {
  const score = personalScore(ratings);

  if (score === null) {
    if (!showEmpty) return null;
    return (
      <View className="flex-row items-center gap-1">
        {[1, 2, 3, 4, 5].map((index) => (
          <Star key={index} size={size} color="#3f3f46" />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1">
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((index) => {
          const fill = score >= index ? 1 : score > index - 1 ? score - (index - 1) : 0;
          return (
            <View key={index} className="relative">
              <Star size={size} color="#52525b" />
              {fill > 0 && (
                <View className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star size={size} color={COLORS.star} fill={COLORS.star} />
                </View>
              )}
            </View>
          );
        })}
      </View>
      <Text className="text-[10px] font-bold text-amber-400">{score.toFixed(1)}</Text>
    </View>
  );
}

/**
 * The compact score badge that sits on a cover. Kept separate from the star row
 * because a badge over artwork needs its own ground to stay legible.
 */
export function ScoreBadge({ ratings }: { ratings?: Ratings | null }) {
  const score = personalScore(ratings);
  if (score === null) return null;

  return (
    <View className="flex-row items-center gap-1 rounded border border-amber-500/30 bg-black/70 px-1.5 py-0.5">
      <Star size={9} color={COLORS.star} fill={COLORS.star} />
      <Text className="text-[10px] font-bold text-amber-400">{score.toFixed(1)}</Text>
    </View>
  );
}
