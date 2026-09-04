import { ActivityIndicator, Text, View } from 'react-native';

// Doc 04 issue K - shared loading UI instead of ad-hoc "Loading..." strings.
type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-16">
      <ActivityIndicator color="hsl(160 84% 39%)" />
      <Text className="text-muted-foreground">{label}</Text>
    </View>
  );
}
