import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

// Overview metric cell (legacy QuickStat.jsx). Layout width is set by the
// parent grid; this just renders the icon+label header and the big value.
type QuickStatProps = {
  value: string | number;
  label: string;
  icon: ReactNode;
  suffix?: string;
};

export function QuickStat({ value, label, icon, suffix }: QuickStatProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</Text>
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-3xl font-bold tracking-tight text-foreground" numberOfLines={1}>
          {value}
        </Text>
        {!!suffix && <Text className="text-base text-muted-foreground">{suffix}</Text>}
      </View>
    </View>
  );
}
