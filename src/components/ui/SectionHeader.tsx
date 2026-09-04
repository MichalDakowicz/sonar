import { Text, View } from 'react-native';

// The blue-bar + title + count used across Home sections (doc 12 part 1) -
// one component instead of repeating the h2 markup on every screen.
type SectionHeaderProps = {
  title: string;
  count?: number;
  action?: React.ReactNode;
};

export function SectionHeader({ title, count, action }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 pb-3">
      <View className="flex-row items-center gap-2">
        <View className="h-5 w-1 rounded-full bg-blue-500" />
        <Text className="text-xl font-bold text-foreground">{title}</Text>
        {count != null && <Text className="text-sm font-normal text-muted-foreground">({count})</Text>}
      </View>
      {action}
    </View>
  );
}
