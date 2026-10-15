import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * How much of the screen the on-screen keyboard covers, 0 while it is down.
 *
 * For surfaces that live in their own window — a `Modal` is not resized by the
 * keyboard, so a sheet anchored to the bottom edge ends up behind it with its
 * field half hidden and its button out of reach. Always 0 on web, where the
 * browser keeps the focused field in view itself.
 *
 * On Android the event's height stops short of the gesture bar the keyboard also
 * covers, so the bar's inset is added back; without it a sheet's last button sits
 * flush against the keys with its bottom padding hidden behind them.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  const { bottom } = useSafeAreaInsets();
  const barInset = Platform.OS === 'android' ? bottom : 0;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillChangeFrame' : 'keyboardDidShow', (event) =>
      setHeight(event.endCoordinates.height + barInset),
    );
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [barInset]);

  return height;
}
