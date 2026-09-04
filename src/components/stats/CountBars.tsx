import { Text, View } from 'react-native';

import type { CountSlice } from '@/lib/stats';
import { COLORS } from '@/theme/colors';

type CountBarsProps = {
  slices: CountSlice[];
  /** Bars are relative to the biggest slice, not to the whole collection. */
  relative?: boolean;
  accent?: string;
};

/**
 * A labelled bar per row — the format split, top artists, top genres, stores.
 * One component for all four because they are the same shape of answer, and the
 * legacy screen repeated the same markup four times with different colours.
 *
 * `relative` scales to the largest row rather than to the collection: a shelf
 * that is 90% vinyl otherwise draws three bars you cannot tell apart.
 */
export function CountBars({ slices, relative = true, accent = COLORS.accent }: CountBarsProps) {
  if (slices.length === 0) return null;
  const max = Math.max(...slices.map((slice) => slice.count), 1);

  return (
    <View className="gap-3.5">
      {slices.map((slice) => {
        const width = relative ? (slice.count / max) * 100 : slice.percent;
        return (
          <View key={slice.name} className="gap-1.5">
            <View className="flex-row items-end justify-between gap-3">
              <Text numberOfLines={1} className="min-w-0 flex-1 text-sm font-medium text-foreground">
                {slice.name}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {slice.count}
                {slice.percent > 0 ? ` · ${slice.percent}%` : ''}
              </Text>
            </View>
            <View className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <View className="h-full rounded-full" style={{ width: `${Math.max(width, 2)}%`, backgroundColor: accent }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
