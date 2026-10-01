import { useRouter, type Href } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';

import { QR_COPY } from './qrCopy';

type RowProps = { title: string; sub: string; onPress: () => void };

function Row({ title, sub, onPress }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="rounded-lg border border-border bg-card px-4 py-4 active:opacity-80"
    >
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      <Text className="text-xs text-muted-foreground">{sub}</Text>
    </Pressable>
  );
}

/**
 * Settings: the two ways to let another device in by QR code (PING.md §9.14). Showing
 * a code works anywhere; scanning one needs a camera, so it is a phone-only row.
 */
export function QrLoginControl() {
  const router = useRouter();
  return (
    <View className="gap-2">
      <Row
        title={QR_COPY.showRowTitle}
        sub={QR_COPY.showRowSub}
        onPress={() => router.push('/qr-show' as Href)}
      />
      {Platform.OS !== 'web' && (
        <Row title={QR_COPY.scanRowTitle} sub={QR_COPY.scanRowSub} onPress={() => router.push('/qr-scan' as Href)} />
      )}
    </View>
  );
}
