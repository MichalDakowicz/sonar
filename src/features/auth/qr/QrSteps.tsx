import { Pressable, Text, View } from 'react-native';

import { QrApprovalCard } from '@/components/qr/QrApprovalCard';
import { QrCodePanel } from '@/components/qr/QrCodePanel';
import type { Requester } from '@/lib/qrAnswers';

import { QR_COPY } from './qrCopy';
import { useSecondsLeft } from './useSecondsLeft';

// Three views the screens share. Each owns its countdown, so a screen can switch
// between them without carrying a timer for whichever one is not showing.

type ApprovalStepProps = {
  matchCode: string;
  requester: Requester;
  expiresAt: string;
  deciding: 'approve' | 'decline' | null;
  onDecide: (verdict: 'approve' | 'decline') => void;
};

/** A request in front of the signed-in person. */
export function ApprovalStep({ matchCode, requester, expiresAt, deciding, onDecide }: ApprovalStepProps) {
  const seconds = useSecondsLeft(expiresAt);
  return (
    <QrApprovalCard
      copy={QR_COPY}
      matchCode={matchCode}
      requester={requester}
      secondsLeft={seconds}
      deciding={deciding}
      onApprove={() => onDecide('approve')}
      onDecline={() => onDecide('decline')}
    />
  );
}

type ShowingStepProps = { payload: string; matchCode: string; expiresAt: string; help: string; size?: number };

/** A code on screen, waiting to be scanned. */
export function ShowingStep({ payload, matchCode, expiresAt, help, size }: ShowingStepProps) {
  const seconds = useSecondsLeft(expiresAt);
  return (
    <QrCodePanel
      copy={QR_COPY}
      payload={payload}
      matchCode={matchCode}
      secondsLeft={seconds}
      help={help}
      size={size}
    />
  );
}

type WaitingStepProps = { matchCode: string; expiresAt: string; onCancel: () => void };

/** The signed-out side after its code was scanned: compare the digits, then wait for a yes. */
export function WaitingStep({ matchCode, expiresAt, onCancel }: WaitingStepProps) {
  const seconds = useSecondsLeft(expiresAt);
  return (
    <View className="items-center gap-5 py-4">
      <Text className="text-xl font-semibold text-foreground">{QR_COPY.waitingTitle}</Text>
      <View className="items-center gap-1">
        <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{QR_COPY.matchCode}</Text>
        <Text
          accessibilityLabel={`${QR_COPY.matchCode} ${matchCode.split('').join(' ')}`}
          className="text-7xl font-bold tracking-widest text-foreground"
        >
          {matchCode}
        </Text>
      </View>
      <Text className="text-center text-sm text-muted-foreground">{QR_COPY.matchHelpWaiting}</Text>
      <Text className="text-xs text-muted-foreground">{QR_COPY.secondsLeft(seconds)}</Text>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        className="rounded-full border border-border px-6 py-3 active:opacity-80"
      >
        <Text className="font-medium text-foreground">{QR_COPY.cancel}</Text>
      </Pressable>
    </View>
  );
}
