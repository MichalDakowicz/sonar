import * as React from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardHeight } from './useKeyboardHeight';

jest.mock('react', () => ({ ...jest.requireActual('react'), useEffect: jest.fn(), useState: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: jest.fn() }));

function TestSurface() {
  return useKeyboardHeight();
}

describe('useKeyboardHeight', () => {
  const setHeight = jest.fn();
  const listeners = new Map<string, (event: { endCoordinates: { height: number } }) => void>();
  const removals: jest.Mock[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    listeners.clear();
    removals.length = 0;
    Platform.OS = 'android';
    (React.useState as jest.Mock).mockReturnValue([0, setHeight]);
    (useSafeAreaInsets as jest.Mock).mockReturnValue({ top: 24, bottom: 16 });
    (jest.spyOn(Keyboard, 'addListener') as jest.Mock).mockImplementation((name, listener) => {
      listeners.set(name, listener);
      const remove = jest.fn();
      removals.push(remove);
      return { remove };
    });
  });

  function mount() {
    expect(TestSurface()).toBe(0);
    return (React.useEffect as jest.Mock).mock.calls[0][0]() as (() => void) | undefined;
  }

  it('includes the Android gesture inset and resets when the keyboard hides', () => {
    mount();
    listeners.get('keyboardDidShow')!({ endCoordinates: { height: 300 } });
    expect(setHeight).toHaveBeenLastCalledWith(316);
    listeners.get('keyboardDidHide')!({ endCoordinates: { height: 300 } });
    expect(setHeight).toHaveBeenLastCalledWith(0);
  });

  it('tracks iOS frame changes without adding the gesture inset', () => {
    Platform.OS = 'ios';
    mount();
    listeners.get('keyboardWillChangeFrame')!({ endCoordinates: { height: 300 } });
    expect(setHeight).toHaveBeenLastCalledWith(300);
    expect(listeners.has('keyboardWillHide')).toBe(true);
  });

  it('leaves browser keyboard handling alone', () => {
    Platform.OS = 'web';
    expect(mount()).toBeUndefined();
    expect(Keyboard.addListener).not.toHaveBeenCalled();
  });

  it('removes both listeners when the surface unmounts', () => {
    const cleanup = mount();
    cleanup!();
    expect(removals).toHaveLength(2);
    removals.forEach((remove) => expect(remove).toHaveBeenCalledTimes(1));
  });
});
