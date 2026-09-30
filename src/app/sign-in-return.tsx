import { useCallback } from 'react';

import { useToast } from '@/components/ui/Toast';
import { HandoffStatus } from '@/features/auth/HandoffStatus';
import { siblingFailureCopy } from '@/features/auth/siblingCopy';
import { useSignInReturn } from '@/features/auth/useSignInReturn';

/** `sonar://sign-in-return` — the sibling Sonar asked has answered (PING.md §9.13). */
export default function SignInReturn() {
  const { show } = useToast();
  const onFailure = useCallback(
    (outcome: Parameters<typeof siblingFailureCopy>[0]) => show(siblingFailureCopy(outcome)),
    [show],
  );
  useSignInReturn(onFailure);
  return <HandoffStatus message="Signing you in…" />;
}
