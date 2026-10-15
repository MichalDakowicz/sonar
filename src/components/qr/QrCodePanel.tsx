import { Text, View } from 'react-native';

import type { QrCopy } from '@/features/auth/qr/qrCopy';

import { formatSignInCode } from '@/lib/signInCode';

import { QrCode } from './QrCode';

type QrCodePanelProps = {
  copy: QrCopy;
  payload: string;
  matchCode: string;
  signInCode?: string;
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
export function QrCodePanel({ copy, payload, matchCode, signInCode, secondsLeft, help, size }: QrCodePanelProps) {
  return (
    <View className="items-center gap-5">
      <View className="overflow-hidden rounded-2xl border border-border bg-white">
        <QrCode value={payload} size={size} />
      </View>

      <View className="items-center gap-1">
        <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{signInCode ? copy.signInCode : copy.matchCode}</Text>
        <Text
          accessibilityLabel={`${signInCode ? copy.signInCode : copy.matchCode} ${(signInCode ?? matchCode).split('').join(' ')}`}
          selectable
          className={signInCode ? "text-xl font-bold tracking-widest text-foreground" : "text-6xl font-bold tracking-widest text-foreground"}
        >
          {signInCode ? formatSignInCode(signInCode) : matchCode}
        </Text>
      </View>

      <Text className="text-center text-sm text-muted-foreground">{help}</Text>
      <Text className="text-xs text-muted-foreground">{copy.secondsLeft(secondsLeft)}</Text>
    </View>
  );
}
