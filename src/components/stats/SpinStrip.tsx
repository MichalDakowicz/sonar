import { Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

type SpinStripProps = {
  perDay: { date: string; count: number }[];
};

/**
 * Listens per day across the chosen window, oldest on the left.
 *
 * Columns rather than a line: a day with nothing played has to read as a gap,
 * and a line chart would interpolate straight through it and imply listening
 * that did not happen. Heights are relative to the busiest day, with a floor so
 * a quiet day is still a visible tick.
 */
export function SpinStrip({ perDay }: SpinStripProps) {
  if (perDay.length === 0) return null;
  const max = Math.max(...perDay.map((day) => day.count), 1);
  const total = perDay.reduce((sum, day) => sum + day.count, 0);
  const first = perDay[0]?.date;
  const last = perDay[perDay.length - 1]?.date;

  return (
    <View className="gap-2">
      <View className="h-24 flex-row items-end gap-[2px]">
        {perDay.map((day) => (
          <View key={day.date} className="min-w-[2px] flex-1 justify-end">
            <View
              className="w-full rounded-sm"
              style={{
                height: day.count === 0 ? 2 : `${Math.max((day.count / max) * 100, 8)}%`,
                backgroundColor: day.count === 0 ? 'hsl(0 0% 18%)' : COLORS.accent,
              }}
            />
          </View>
        ))}
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] text-muted-foreground">{shortDate(first)}</Text>
        <Text className="text-[11px] text-muted-foreground">
          {total} {total === 1 ? 'spin' : 'spins'}
        </Text>
        <Text className="text-[11px] text-muted-foreground">{shortDate(last)}</Text>
      </View>
    </View>
  );
}

function shortDate(key: string | undefined): string {
  if (!key) return '';
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
