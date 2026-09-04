import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Status-bar clearance for a tab screen. The global top bar used to provide it
 * as a side effect of its own padding; with the bar gone, every screen owns the
 * inset itself.
 *
 * `extra` is the breathing room above the screen's first control — pass 0 on a
 * screen whose first element is meant to run to the top (Browse's hero).
 */
export function ScreenTop({ extra = 8 }: { extra?: number }) {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.top + extra }} />;
}
