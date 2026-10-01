import { useEffect, useState } from 'react';

import { secondsLeft } from '@/lib/qrLogin';

/** Whole seconds until `expiresAt`, counting down once a second. Zero when there is nothing to count. */
export function useSecondsLeft(expiresAt: string | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return expiresAt ? secondsLeft(expiresAt, now) : 0;
}
