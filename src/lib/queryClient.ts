import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

// react-query's focus tracking is a browser concept out of the box — it listens
// for visibilitychange, which never fires on Android. Without this, coming back
// from the background refetches nothing: anything that changed while the app was
// away (a notification delivered by push, a friend accepting) stays stale until
// the screen holding it remounts. Feed the manager AppState instead and every
// mounted query refreshes on app open.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
  return () => subscription.remove();
});
