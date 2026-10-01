import { Text, View } from 'react-native';

import type { QrCopy } from '@/features/auth/qr/qrCopy';

import { QrCode } from './QrCode';

type QrCodePanelProps = {
  copy: QrCopy;
  payload: string;
  matchCode: string;
  secondsLeft: number;
  /** One line under the digits: what to do with the code. */
  help: string;
  size?: number;
};

/**
 * A code to be scanned, and the two digits that go with it. The digits are not
 * decoration: they are what lets the person on the approving phone tell this
 * pairing from one somebody else handed them (PING.md §9.14).
 */
export function QrCodePanel({ copy, payload, matchCode, secondsLeft, help, size }: QrCodePanelProps) {
  return (
    <View className="items-center gap-5">
      <View className="overflow-hidden rounded-2xl border border-border bg-white">
        <QrCode value={payload} size={size} />
      </View>

      <View className="items-center gap-1">
        <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{copy.matchCode}</Text>
        <Text
          accessibilityLabel={`${copy.matchCode} ${matchCode.split('').join(' ')}`}
          className="text-6xl font-bold tracking-widest text-foreground"
        >
          {matchCode}
        </Text>
      </View>

      <Text className="text-center text-sm text-muted-foreground">{help}</Text>
      <Text className="text-xs text-muted-foreground">{copy.secondsLeft(secondsLeft)}</Text>
    </View>
  );
}
