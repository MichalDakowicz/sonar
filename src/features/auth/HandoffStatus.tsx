import { ActivityIndicator, Text, View } from 'react-native';

import Logo from '@/assets/brand/logo.svg';
import { COLORS } from '@/theme/colors';

/**
 * What either end of a sibling sign-in shows while it works — for about a
 * second, usually. The auth screen's tile, so the handoff reads as this app
 * rather than as a blank frame between two apps.
 */
export function HandoffStatus({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
      <View className="h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Logo width={48} height={48} />
      </View>
      <ActivityIndicator color={COLORS.accent} />
      <Text className="text-center text-muted-foreground">{message}</Text>
    </View>
  );
}
