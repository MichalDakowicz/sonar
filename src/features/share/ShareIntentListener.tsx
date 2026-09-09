import { useEffect } from 'react';

import { addSharedTextListener, getSharedText } from '@/features/share/shareIntentModule';
import { useShareIntentStore } from '@/store/shareIntent';

/**
 * Hands a share from the native side to the store the sheet watches.
 *
 * Mounted inside the tabs layout rather than at the root, so it only runs for a
 * signed-in session. A share that arrives on the sign-in screen is not lost by
 * that: the native module holds the text until JS asks for it, and this asks on
 * mount — which is the moment the user finishes signing in.
 */
export function ShareIntentListener() {
  const setSharedText = useShareIntentStore((state) => state.setSharedText);

  useEffect(() => {
    const pending = getSharedText();
    if (pending) setSharedText(pending);

    const subscription = addSharedTextListener(setSharedText);
    return () => subscription.remove();
  }, [setSharedText]);

  return null;
}
