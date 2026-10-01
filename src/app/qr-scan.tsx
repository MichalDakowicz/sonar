import { Redirect, type Href } from 'expo-router';
import { Platform, Text } from 'react-native';

import { QrNotice } from '@/components/qr/QrNotice';
import { QrScanner } from '@/components/qr/QrScanner';
import { QrScreenFrame } from '@/components/qr/QrScreenFrame';
import { QR_COPY } from '@/features/auth/qr/qrCopy';
import { QrEnding } from '@/features/auth/qr/QrEnding';
import { ApprovalStep, WaitingStep } from '@/features/auth/qr/QrSteps';
import { useBack } from '@/features/auth/qr/useBack';
import { useQrScan } from '@/features/auth/qr/useQrScan';

/**
 * One camera, both directions (PING.md §9.14). Signed in, it approves a browser that
 * is showing a code. Signed out — reached from the sign-in screen — it signs this
 * device in from a signed-in phone that is showing one. Reachable signed out on
 * purpose: it is how a signed-out device gets in.
 */
export default function QrScan() {
  const back = useBack();
  const { signedIn, approver, requester, notice, onTarget } = useQrScan();
  const a = approver.state;
  const r = requester.state;

  // Signed in by the code: the sign-in screen's own redirect would get there too, but this
  // screen is not that one.
  if (signedIn && r.phase === 'signing-in') return <Redirect href={'/' as Href} />;

  const scanning = signedIn ? a.phase === 'idle' : r.phase === 'idle';
  const again = (label: string) => ({ label, onPress: signedIn ? approver.reset : requester.reset });

  return (
    <QrScreenFrame title={QR_COPY.scanTitle} backLabel={QR_COPY.back} onBack={back}>
      {Platform.OS === 'web' ? (
        <QrNotice title={QR_COPY.scanTitle} body={QR_COPY.cameraOff} primary={{ label: QR_COPY.back, onPress: back }} />
      ) : scanning ? (
        <>
          <QrScanner
            copy={QR_COPY}
            hint={signedIn ? QR_COPY.scanHintSignedIn : QR_COPY.scanHintSignedOut}
            onTarget={onTarget}
          />
          {!!notice && <Text className="text-center text-sm text-foreground">{notice}</Text>}
        </>
      ) : a.phase === 'working' || r.phase === 'working' ? (
        <QrNotice busy title={QR_COPY.checking} />
      ) : a.phase === 'confirm' ? (
        <ApprovalStep
          matchCode={a.matchCode}
          requester={a.requester}
          expiresAt={a.expiresAt}
          deciding={a.deciding}
          onDecide={approver.decide}
        />
      ) : a.phase === 'approved' ? (
        <QrEnding kind="approved" onDone={back} />
      ) : a.phase === 'declined' ? (
        <QrEnding kind="declined" again={again(QR_COPY.scanAnother)} onDone={back} />
      ) : a.phase === 'ended' ? (
        <QrEnding kind={a.reason} detail={a.detail} again={again(QR_COPY.scanAnother)} onDone={back} />
      ) : r.phase === 'deciding' ? (
        <WaitingStep matchCode={r.matchCode} expiresAt={r.expiresAt} onCancel={requester.reset} />
      ) : r.phase === 'signing-in' ? (
        <QrNotice busy title={QR_COPY.signingIn} />
      ) : r.phase === 'denied' ? (
        <QrEnding kind="denied" again={again(QR_COPY.scanAnother)} onDone={back} />
      ) : r.phase === 'ended' ? (
        <QrEnding kind={r.reason} detail={r.detail} again={again(QR_COPY.scanAnother)} onDone={back} />
      ) : null}
    </QrScreenFrame>
  );
}
