import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { QR_COPY } from './qrCopy';
import { WebLoginQr } from './WebLoginQr';

/**
 * The sign-in screen's way in by QR code (PING.md §9.14), beside the sibling row.
 * On a phone it opens the scanner, for a code a signed-in phone is showing. On the
 * web it opens a code of its own, for a signed-in phone to scan.
 */
export function QrSignInEntry({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const web = Platform.OS === 'web';

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => (web ? setOpen((current) => !current) : router.push('/qr-scan' as Href))}
        disabled={disabled}
        accessibilityRole="button"
        className="items-center rounded-full border border-border py-3 active:opacity-80"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <Text className="font-medium text-foreground">{web ? QR_COPY.loginShowOnWeb : QR_COPY.loginScan}</Text>
      </Pressable>
      {web && open && (
        <View className="rounded-2xl border border-border bg-card p-5">
          <WebLoginQr />
        </View>
      )}
    </View>
  );
}
