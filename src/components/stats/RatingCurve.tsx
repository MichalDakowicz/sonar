import { Text, View } from 'react-native';

import type { RatingDistributionResult } from '@/lib/ratingDistribution';
import { COLORS } from '@/theme/colors';

/**
 * How you rate, as a curve.
 *
 * The average alone cannot separate a generous rater from a harsh one — 3.6 is
 * the mean of both. The shape is the habit: where the mass sits, whether the
 * bottom half is ever used, whether 5s get handed out. Heights come from the
 * smoothed density in lib/ratingDistribution so a shelf rated in half stars
 * reads as a curve rather than as a comb of spikes and gaps.
 */
export function RatingCurve({ distribution }: { distribution: RatingDistributionResult }) {
  const { points, rated, average } = distribution;
  if (rated === 0) {
    return (
      <View className="gap-2">
        <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">How you rate</Text>
        <Text className="text-xs text-muted-foreground">
          Nothing rated yet. Open any album — owned or not — and give it a score.
        </Text>
      </View>
    );
  }

  const max = Math.max(...points.map((point) => point.density), 0.0001);

  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between">
        <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">How you rate</Text>
        <Text className="text-xs text-muted-foreground">
          {rated} rated{average != null ? ` · avg ${average.toFixed(1)}` : ''}
        </Text>
      </View>

      <View className="h-24 flex-row items-end gap-[1px]">
        {points.map((point) => (
          <View key={point.value} className="flex-1 justify-end">
            <View
              className="w-full rounded-t-sm"
              style={{
                height: `${Math.max((point.density / max) * 100, 1.5)}%`,
                // Steps nobody landed on stay visible but recede — the gaps are
                // part of the shape, not noise to hide.
                backgroundColor: point.count > 0 ? COLORS.accent : 'hsl(0 0% 16%)',
              }}
            />
          </View>
        ))}
      </View>

      <View className="flex-row justify-between">
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} className="text-[11px] text-muted-foreground">
            {star}★
          </Text>
        ))}
      </View>
    </View>
  );
}
