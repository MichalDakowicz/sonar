import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import type { TextInput } from 'react-native';

import { useSearchFocus } from '@/store/searchFocus';

/**
 * Publishes a screen's search input to the global "/" shortcut while that screen
 * is the focused route. Focus-scoped rather than mount-scoped: tab screens stay
 * mounted after their first visit, so registering on mount would leave the last
 * *mounted* search box winning instead of the one you're looking at.
 *
 *   const searchRef = useSearchFocusRegistration();
 *   <TextInput ref={searchRef} … />
 */
export function useSearchFocusRegistration() {
  const inputRef = useRef<TextInput>(null);
  const setFocus = useSearchFocus((s) => s.setFocus);

  useFocusEffect(
    useCallback(() => {
      setFocus(() => inputRef.current?.focus());
      return () => setFocus(null);
    }, [setFocus]),
  );

  return inputRef;
}
