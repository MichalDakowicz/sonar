import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { QrCopy } from '@/features/auth/qr/qrCopy';
import { readQrPayload, type QrTarget } from '@/lib/qrLogin';

/** The camera reports a frame at a time; the same code in view must not become thirty requests. */
const SAME_CODE_MS = 3000;

type QrScannerProps = {
  copy: QrCopy;
  hint: string;
  /** Called for a Ping sign-in code and nothing else. */
  onTarget: (target: QrTarget) => void;
};

/**
 * A camera that reads QR codes. Whatever it sees, only text `readQrPayload` accepts
 * gets out — a poster, a ticket or a stranger's code is dropped without a word, so
 * the pointing around that scanning involves never reaches the server.
 */
export function QrScanner({ copy, hint, onTarget }: QrScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const last = useRef<{ text: string; at: number } | null>(null);

  // Ask once, as the screen opens: the button below is for trying again, not for the first go.
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current || !permission || permission.granted || !permission.canAskAgain) return;
    asked.current = true;
    void requestPermission();
  }, [permission, requestPermission]);

  const onScanned = useCallback(
    ({ data }: { data: string }) => {
      const target = readQrPayload(data);
      if (!target) return;
      const now = Date.now();
      if (last.current?.text === data && now - last.current.at < SAME_CODE_MS) return;
      last.current = { text: data, at: now };
      onTarget(target);
    },
    [onTarget],
  );

  if (!permission) return <View className="aspect-square w-full rounded-2xl bg-secondary" />;

  if (!permission.granted) {
    return (
      <View className="items-center gap-4 rounded-2xl border border-border bg-card p-6">
        <Text className="text-center text-sm text-muted-foreground">
          {permission.canAskAgain ? copy.cameraNeeded : copy.cameraOff}
        </Text>
        {permission.canAskAgain && (
          <Pressable
            onPress={requestPermission}
            accessibilityRole="button"
            className="rounded-full bg-primary px-5 py-2.5 active:opacity-80"
          >
            <Text className="font-semibold text-primary-foreground">{copy.cameraAllow}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="aspect-square w-full overflow-hidden rounded-2xl bg-black">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScanned}
        />
        {/* A frame to aim with. The scanner reads the whole picture; this only shows where to put the code. */}
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <View className="h-3/5 w-3/5 rounded-2xl border-2 border-white/70" />
        </View>
      </View>
      <Text className="text-center text-sm text-muted-foreground">{hint}</Text>
    </View>
  );
}
