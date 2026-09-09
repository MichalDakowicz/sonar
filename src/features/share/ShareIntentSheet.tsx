import { useCallback, useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';

import { Sheet, type BottomSheetModal } from '@/components/ui/Sheet';
import { ShareFlowBody } from '@/features/share/ShareFlowBody';
import { clearSharedText } from '@/features/share/shareIntentModule';
import { useShareIntentStore } from '@/store/shareIntent';

/**
 * Share a song, a single, an album or an artist from Spotify and land here.
 *
 * Mounted once by the tabs layout and opens itself when a share arrives, the
 * same way the Quick-Add sheet is opened from the nav bar. The tabs inside are
 * the reason it exists: what was shared is rarely exactly what belongs on a
 * shelf — a song has to become the album or the 7" it is on, and an artist has
 * to become one of their releases.
 */
export function ShareIntentSheet() {
  const ref = useRef<BottomSheetModal>(null);
  const sharedText = useShareIntentStore((state) => state.sharedText);
  const setSharedText = useShareIntentStore((state) => state.setSharedText);

  // Consume the share on the way out, so coming back to the app does not reopen
  // it over whatever the user has already done with it.
  const finish = useCallback(() => {
    ref.current?.dismiss();
    clearSharedText();
    setSharedText(null);
  }, [setSharedText]);

  useEffect(() => {
    if (sharedText) ref.current?.present();
  }, [sharedText]);

  return (
    <Sheet ref={ref} snapPoints={['75%', '92%']} maxWidth={520} onDismiss={finish}>
      <ScrollView contentContainerClassName="gap-5 p-4 pb-8" keyboardShouldPersistTaps="handled">
        {/* Keyed on the share: a second one arriving starts every choice clean. */}
        <ShareFlowBody key={sharedText ?? 'idle'} text={sharedText} onDone={finish} />
      </ScrollView>
    </Sheet>
  );
}
