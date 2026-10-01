import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import type { QrTarget } from '@/lib/qrLogin';

import { QR_COPY } from './qrCopy';
import { useQrApprover } from './useQrApprover';
import { useQrRequester } from './useQrRequester';

/**
 * The scanner screen's brain: one camera, two meanings (PING.md §9.14). Signed in,
 * a browser's code is a request to approve. Signed out, a phone's code is a way in.
 * A code meant for the other side is still a Ping code, so it is answered with what
 * to do instead rather than ignored like a poster would be.
 */
export function useQrScan() {
  const { user } = useAuth();
  const approver = useQrApprover();
  const requester = useQrRequester();
  const [notice, setNotice] = useState<string | null>(null);

  const { claim } = approver;
  const { join } = requester;
  const onTarget = useCallback(
    (target: QrTarget) => {
      if (user) {
        if (target.mode === 'web') {
          setNotice(null);
          void claim(target.id);
        } else {
          setNotice(QR_COPY.scannedPhoneCodeWhileSignedIn);
        }
      } else if (target.mode === 'phone') {
        setNotice(null);
        void join(target);
      } else {
        setNotice(QR_COPY.scannedBrowserCodeWhileSignedOut);
      }
    },
    [user, claim, join],
  );

  return { signedIn: Boolean(user), approver, requester, notice, onTarget };
}
