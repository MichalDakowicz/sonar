import { Redirect, type Href } from 'expo-router';
import { useEffect } from 'react';

import { QrNotice } from '@/components/qr/QrNotice';
import { QrScreenFrame } from '@/components/qr/QrScreenFrame';
import { useAuth } from '@/features/auth/AuthProvider';
import { QR_COPY } from '@/features/auth/qr/qrCopy';
import { QrEnding } from '@/features/auth/qr/QrEnding';
import { ApprovalStep, ShowingStep } from '@/features/auth/qr/QrSteps';
import { useBack } from '@/features/auth/qr/useBack';
import { useQrApprover } from '@/features/auth/qr/useQrApprover';

/**
 * Shows a code for a signed-out device to scan, then asks whether to let it in
 * (PING.md §9.14). Signed-in only: a code from a session-less app would sign nobody in.
 */
export default function QrShow() {
  const { user } = useAuth();
  const back = useBack();
  const { state, showCode, decide } = useQrApprover();

  useEffect(() => {
    if (user) void showCode();
  }, [user, showCode]);

  if (!user) return <Redirect href={'/login' as Href} />;

  return (
    <QrScreenFrame title={QR_COPY.showTitle} backLabel={QR_COPY.back} onBack={back}>
      {state.phase === 'idle' || state.phase === 'working' ? (
        <QrNotice busy title={QR_COPY.gettingCode} />
      ) : state.phase === 'showing' ? (
        <ShowingStep payload={state.payload} matchCode={state.matchCode} expiresAt={state.expiresAt} help={QR_COPY.showHint} />
      ) : state.phase === 'confirm' ? (
        <ApprovalStep
          matchCode={state.matchCode}
          requester={state.requester}
          expiresAt={state.expiresAt}
          deciding={state.deciding}
          onDecide={decide}
        />
      ) : state.phase === 'approved' ? (
        <QrEnding kind="approved" onDone={back} />
      ) : state.phase === 'declined' ? (
        <QrEnding kind="declined" again={{ label: QR_COPY.newCode, onPress: () => void showCode() }} onDone={back} />
      ) : (
        <QrEnding
          kind={state.reason}
          detail={state.detail}
          again={{ label: QR_COPY.newCode, onPress: () => void showCode() }}
          onDone={back}
        />
      )}
    </QrScreenFrame>
  );
}
