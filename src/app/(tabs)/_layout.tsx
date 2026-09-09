import { Redirect, Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';

import { NavIslands } from '@/components/layout/NavIslands';
import type { BottomSheetModal } from '@/components/ui/Sheet';
import { QuickAddSheet } from '@/features/albums/add/QuickAddSheet';
import { useAuth } from '@/features/auth/AuthProvider';
import { FriendRequestListener } from '@/features/friends/FriendRequestListener';
import { ShareIntentListener } from '@/features/share/ShareIntentListener';
import { ShareIntentSheet } from '@/features/share/ShareIntentSheet';
import { StatsPeriodSheet } from '@/features/stats/StatsPeriodSheet';
import { useQuickAddSheetStore } from '@/store/quickAddSheet';
import { useStatsPeriodSheet } from '@/store/statsPeriod';

/**
 * Bottom tab shell. The bar is the floating nav islands on every viewport,
 * phone and desktop web alike — it is the app's only navigation chrome, and it
 * drives itself off the route rather than off this navigator so it can also
 * render on /settings, /inbox and /history.
 *
 * Keep the screen order below in sync with NAV_DESTINATIONS: the web digit
 * shortcuts index into that list.
 */
export default function TabsLayout() {
  const { user } = useAuth();
  const quickAddRef = useRef<BottomSheetModal>(null);
  const periodRef = useRef<BottomSheetModal>(null);
  const setPresentQuickAdd = useQuickAddSheetStore((s) => s.setPresent);
  const setPresentPeriod = useStatsPeriodSheet((s) => s.setPresent);

  // Both sheets mount once here rather than per screen, so anything on any
  // route can open the same instance: Add from the nav's left action on the
  // collection, the period picker from that action on Stats and from the pill.
  useEffect(() => {
    setPresentQuickAdd(() => quickAddRef.current?.present());
    return () => setPresentQuickAdd(null);
  }, [setPresentQuickAdd]);

  useEffect(() => {
    setPresentPeriod(() => periodRef.current?.present());
    return () => setPresentPeriod(null);
  }, [setPresentPeriod]);

  if (!user) return <Redirect href="/login" />;

  return (
    <>
      <Tabs
        tabBar={() => <NavIslands />}
        // No scene animation: react-navigation cross-fades over the navigator's
        // own background, which flashes white on every swap. The movement that
        // makes a tab change feel smooth lives in the nav bar instead, where the
        // marker slides between destinations. sceneStyle pins the app background
        // so nothing can show through between screens.
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'hsl(0 0% 3.9%)' } }}
      >
        <Tabs.Screen name="index" options={{ title: 'Collection' }} />
        <Tabs.Screen name="ratings" options={{ title: 'Ratings' }} />
        <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
        <Tabs.Screen name="social" options={{ title: 'Social' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
      <QuickAddSheet ref={quickAddRef} />
      <StatsPeriodSheet ref={periodRef} onPicked={() => periodRef.current?.dismiss()} />
      {/* Opens itself when another app shares a Spotify link in, so it needs no
          ref here and no nav action to reach it. */}
      <ShareIntentSheet />
      <ShareIntentListener />
      <FriendRequestListener />
    </>
  );
}
