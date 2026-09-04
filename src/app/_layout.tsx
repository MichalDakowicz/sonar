import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { NAV_DESTINATIONS } from '@/components/layout/navDestinations';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { useWebShortcuts } from '@/hooks/useWebShortcuts';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  // Children never mount until auth resolves, so no screen can flash the
  // signed-out state on a cold start with a valid session.
  if (loading) return null;

  return <>{children}</>;
}

/**
 * Root-level keyboard wiring for the browser build. Nav chrome itself is the
 * floating islands at the bottom, but the digit shortcuts have to be registered
 * above the navigator so they work on every route, not only the five tabs.
 */
function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const selectTab = useCallback(
    (index: number) => {
      const destination = NAV_DESTINATIONS[index];
      if (destination) router.navigate(destination.href);
    },
    [router],
  );
  useWebShortcuts({ onSelectTab: selectTab });

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthGate>
                <AppShell>
                  <Stack screenOptions={{ headerShown: false }} />
                </AppShell>
              </AuthGate>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
