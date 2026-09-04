import { Pressable, Text, View } from 'react-native';

import type { DecadeSlice } from '@/lib/stats';

// Release-eras column chart (legacy SmoothDecadeBar row). Pure Views - the
// legacy "chart" was CSS-height bars, so no react-native-svg is needed here.
type DecadeBarsProps = {
  decades: DecadeSlice[];
  /** Own-stats screen only; without it the columns stay inert. */
  onPressDecade?: (decade: string) => void;
};

export function DecadeBars({ decades, onPressDecade }: DecadeBarsProps) {
  const max = Math.max(...decades.map((d) => d.count), 1);
  // A Pressable only where a press leads somewhere, so the public shelf renders
  // the same columns with no touch feedback at all.
  const Column = onPressDecade ? Pressable : View;

  return (
    <View className="h-48 flex-row items-end justify-between gap-2 px-2">
      {decades.map((item) => {
        const heightPercent = Math.max((item.count / max) * 100, 4);
        return (
          <Column
            key={item.decade}
            onPress={onPressDecade ? () => onPressDecade(item.decade) : undefined}
            className="h-full flex-1 items-center gap-3"
          >
            <Text className="text-xs font-semibold text-muted-foreground">{item.count}</Text>
            <View className="w-full max-w-[3rem] flex-1 justify-end overflow-hidden rounded-t-xl bg-secondary">
              <View className="w-full rounded-t-xl bg-foreground/80" style={{ height: `${heightPercent}%` }} />
            </View>
            <Text className="text-xs font-semibold text-muted-foreground">{item.decade}</Text>
          </Column>
        );
      })}
    </View>
  );
}
