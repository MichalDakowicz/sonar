import { useEffect } from 'react';

import { QrNotice } from '@/components/qr/QrNotice';

import { QR_COPY } from './qrCopy';
import { QrEnding } from './QrEnding';
import { ShowingStep, WaitingStep } from './QrSteps';
import { useQrRequester } from './useQrRequester';

/**
 * The browser's half of QR sign-in (PING.md §9.14): a code on the sign-in page for a
 * signed-in phone to scan. Mounted only once someone asks for it, so a sign-in page
 * that is merely visited never creates a pairing — and unmounting it (closing the
 * panel) stops the polling, which is all the cleanup a pairing needs: it expires.
 *
 * When the phone approves, `useQrRequester` redeems the token itself, the session
 * lands, and the sign-in screen's own redirect takes the page home.
 */
export function WebLoginQr() {
  const { state, showCode, reset } = useQrRequester();

  useEffect(() => {
    void showCode();
  }, [showCode]);

  const fresh = () => void showCode();

  switch (state.phase) {
    case 'idle':
    case 'working':
      return <QrNotice busy title={QR_COPY.gettingCode} />;
    case 'showing':
      return (
        <ShowingStep
          payload={state.payload}
          matchCode={state.matchCode}
          expiresAt={state.expiresAt}
          help={QR_COPY.webHelp}
          size={260}
        />
      );
    case 'deciding':
      return (
        <WaitingStep
          matchCode={state.matchCode}
          expiresAt={state.expiresAt}
          onCancel={() => {
            reset();
            fresh();
          }}
        />
      );
    case 'signing-in':
      return <QrNotice busy title={QR_COPY.signingIn} />;
    case 'denied':
      return <QrEnding kind="denied" again={{ label: QR_COPY.newCode, onPress: fresh }} onDone={reset} />;
    case 'ended':
      return (
        <QrEnding
          kind={state.reason}
          detail={state.detail}
          again={{ label: QR_COPY.newCode, onPress: fresh }}
          onDone={reset}
        />
      );
  }
}
