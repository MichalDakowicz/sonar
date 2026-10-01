import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { QrCopy } from '@/features/auth/qr/qrCopy';
import type { Requester } from '@/lib/qrAnswers';
import { countryName } from '@/lib/qrDeviceLabel';

type QrApprovalCardProps = {
  copy: QrCopy;
  matchCode: string;
  requester: Requester;
  secondsLeft: number;
  /** Which button is waiting on the server, if one is. */
  deciding: 'approve' | 'decline' | null;
  onApprove: () => void;
  onDecline: () => void;
};

/**
 * The screen the whole scheme leans on (PING.md §9.14). A QR code is easy to show
 * someone and hard to read, so this is where a person gets to notice that the code
 * they were handed is not the one they started. It says three things and offers two
 * buttons: the match code to compare, what the requesting device *says* it is, and
 * where the server *saw* it. There is no approve-on-scan and no third button.
 */
export function QrApprovalCard({
  copy,
  matchCode,
  requester,
  secondsLeft,
  deciding,
  onApprove,
  onDecline,
}: QrApprovalCardProps) {
  const country = requester.country ? (countryName(requester.country) ?? requester.country) : copy.unknownCountry;
  const busy = deciding !== null;

  return (
    <View className="gap-6">
      <View className="items-center gap-2">
        <Text className="text-lg font-semibold text-foreground">{copy.approveTitle}</Text>
        <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{copy.matchCode}</Text>
        <Text
          accessibilityLabel={`${copy.matchCode} ${matchCode.split('').join(' ')}`}
          className="text-7xl font-bold tracking-widest text-foreground"
        >
          {matchCode}
        </Text>
        <Text className="text-center text-sm text-muted-foreground">{copy.matchHelpShowing}</Text>
      </View>

      <View className="gap-3 rounded-2xl border border-border bg-card p-4">
        <View className="gap-0.5">
          <Text className="text-xs text-muted-foreground">{copy.saysItIs}</Text>
          <Text className="text-base font-semibold text-foreground">{requester.label}</Text>
        </View>
        <View className="h-px bg-border" />
        <View className="gap-0.5">
          <Text className="text-xs text-muted-foreground">{copy.seenFrom}</Text>
          <Text className="text-base font-semibold text-foreground">{country}</Text>
        </View>
      </View>

      <Text className="text-center text-sm text-muted-foreground">{copy.approveWarning}</Text>

      <View className="gap-3">
        <Pressable
          onPress={onApprove}
          disabled={busy}
          accessibilityRole="button"
          className="flex-row items-center justify-center gap-2 rounded-full bg-primary py-3.5 active:opacity-80"
          style={{ opacity: busy && deciding !== 'approve' ? 0.5 : 1 }}
        >
          {deciding === 'approve' && <ActivityIndicator size="small" color="white" />}
          <Text className="font-semibold text-primary-foreground">{copy.approve}</Text>
        </Pressable>
        <Pressable
          onPress={onDecline}
          disabled={busy}
          accessibilityRole="button"
          className="items-center rounded-full border border-border py-3.5 active:opacity-80"
          style={{ opacity: busy && deciding !== 'decline' ? 0.5 : 1 }}
        >
          <Text className="font-medium text-foreground">{copy.decline}</Text>
        </Pressable>
        <Text className="text-center text-xs text-muted-foreground">{copy.secondsLeft(secondsLeft)}</Text>
      </View>
    </View>
  );
}
