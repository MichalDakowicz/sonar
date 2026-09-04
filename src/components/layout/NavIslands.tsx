import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBlurTarget } from '@/components/layout/BlurTarget';
import { DEST_HEIGHT, DEST_WIDTH, NavDestinationButton } from '@/components/layout/NavDestinationButton';
import { useNavAction, useSocialAlert } from '@/components/layout/navActions';
import { activeTabFor, NAV_DESTINATIONS, type NavDestination } from '@/components/layout/navDestinations';
import { useAuth } from '@/features/auth/AuthProvider';
import { Avatar } from '@/features/friends/Avatar';
import { NAV_ISLAND_GAP, NAV_ISLAND_HEIGHT } from '@/hooks/useNavBarSpace';
import { useProfile } from '@/hooks/useProfile';
import { useTabReload } from '@/store/tabReload';

const ACCENT = 'hsl(160 84% 39%)';
const FILL = 'rgba(22,22,22,0.72)';
const HAIRLINE = 'rgba(255,255,255,0.09)';
const ACTIVE_PLATE = 'rgba(255,255,255,0.12)';
const ICON_ON = '#fafafa';

// Real backdrop blur on Android needs the Dimezis backend; without it BlurView
// falls back to a flat tint, which would leave the islands looking painted on.
const BLUR_METHOD = Platform.OS === 'android' ? 'dimezisBlurView' : 'none';

const DESTINATIONS = NAV_DESTINATIONS.slice(0, 4);
const PROFILE = NAV_DESTINATIONS[NAV_DESTINATIONS.length - 1];

const DEST_GAP = 2;
const PILL_PAD = 4;
/** Distance the marker travels per destination. */
const SLOT = DEST_WIDTH + DEST_GAP;

// A second press on a destination within this window reloads that screen — the
// same contract the tab navigator's own bar used to provide.
const DOUBLE_PRESS_MS = 400;

/**
 * The bottom navigation: three floating islands in a 1–4–1 rhythm — the current
 * screen's one action on the left, the four destinations in the middle, you on
 * the right (Claude Design "Nav Islands", take 1a Glass).
 *
 * It replaced the top bar outright. Every control that used to live up there is
 * either the left action now (see navActions) or moved onto the page it belongs
 * to, which is why screens no longer render chrome of their own.
 *
 * Route-driven rather than wired into the tab navigator, because it also mounts
 * on routes pushed out of the tabs (/settings, /inbox) so the bar
 * never disappears mid-journey. Absolutely positioned on purpose: the glass is
 * only glass if posters scroll under it. Bodies pad for it with `useNavBarSpace`.
 */
export function NavIslands() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const bump = useTabReload((s) => s.bump);
  const lastPress = useRef<{ tabName: string; time: number } | null>(null);
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  const blurTarget = useBlurTarget();
  const activeTab = activeTabFor(pathname);
  const action = useNavAction(pathname, activeTab);
  const socialAlert = useSocialAlert();

  const activeIndex = DESTINATIONS.findIndex((destination) => destination.tabName === activeTab);
  // One marker that travels, rather than four that fade in place — the slide is
  // what tells you which way you moved.
  const offset = useSharedValue(Math.max(activeIndex, 0));
  const shown = useSharedValue(activeIndex >= 0 ? 1 : 0);

  useEffect(() => {
    // Left parked where it was while Profile is active, so coming back slides
    // from the destination you actually left rather than from the far left.
    if (activeIndex >= 0) offset.value = withTiming(activeIndex, { duration: 260, easing: Easing.out(Easing.cubic) });
    shown.value = withTiming(activeIndex >= 0 ? 1 : 0, { duration: 160 });
  }, [activeIndex, offset, shown]);

  const markerStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateX: offset.value * SLOT }],
  }));

  const go = useCallback(
    (destination: NavDestination) => {
      const now = Date.now();
      const previous = lastPress.current;
      lastPress.current = { tabName: destination.tabName, time: now };
      // Second press inside the window reloads; the first just goes there (or
      // stays), so a stray tap never wipes a screen's state by accident.
      if (previous?.tabName === destination.tabName && now - previous.time < DOUBLE_PRESS_MS) bump(destination.tabName);
      router.navigate(destination.href);
    },
    [bump, router],
  );

  const profileActive = activeTab === PROFILE.tabName;

  return (
    <View
      style={[styles.bar, { bottom: insets.bottom + NAV_ISLAND_GAP }]}
      // The row spans the screen so the islands can centre in it, but only the
      // islands themselves may swallow taps — the rest is scrolling content.
      pointerEvents="box-none"
    >
      <Island style={styles.round} blurTarget={blurTarget}>
        <Pressable onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.label} style={styles.roundPress}>
          <action.Icon size={21} color={ICON_ON} strokeWidth={2.2} />
          {action.badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{action.badge > 9 ? '9+' : action.badge}</Text>
            </View>
          )}
        </Pressable>
      </Island>

      <Island style={styles.pill} blurTarget={blurTarget}>
        <Animated.View style={[styles.marker, markerStyle]} pointerEvents="none" />
        {DESTINATIONS.map((destination) => (
          <NavDestinationButton
            key={destination.tabName}
            destination={destination}
            active={destination.tabName === activeTab}
            alert={destination.tabName === 'social' && socialAlert}
            onPress={() => go(destination)}
          />
        ))}
      </Island>

      <Island style={[styles.round, { borderColor: profileActive ? ACCENT : HAIRLINE }]} blurTarget={blurTarget}>
        <Pressable
          onPress={() => go(PROFILE)}
          accessibilityRole="tab"
          accessibilityState={{ selected: profileActive }}
          accessibilityLabel={PROFILE.label}
          style={styles.roundPress}
        >
          <Avatar profile={profile} size={44} />
        </Pressable>
      </Island>
    </View>
  );
}

/** One glass plate: blurred backdrop, translucent fill, hairline edge. */
function Island({
  children,
  style,
  blurTarget,
}: {
  children: ReactNode;
  style?: object | object[];
  blurTarget?: RefObject<View | null>;
}) {
  return (
    <View style={[styles.island, style]}>
      <BlurView
        intensity={38}
        tint="dark"
        blurMethod={BLUR_METHOD}
        blurTarget={blurTarget}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  island: {
    height: NAV_ISLAND_HEIGHT,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: FILL,
    overflow: 'hidden',
  },
  round: { width: NAV_ISLAND_HEIGHT },
  roundPress: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: DEST_GAP, paddingHorizontal: PILL_PAD },
  marker: {
    position: 'absolute',
    left: PILL_PAD,
    top: (NAV_ISLAND_HEIGHT - DEST_HEIGHT) / 2 - 1,
    width: DEST_WIDTH,
    height: DEST_HEIGHT,
    borderRadius: 99,
    backgroundColor: ACTIVE_PLATE,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    borderWidth: 1.5,
    borderColor: '#161616',
  },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
});
