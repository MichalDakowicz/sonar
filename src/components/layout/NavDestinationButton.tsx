import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { NavDestination } from '@/components/layout/navDestinations';

const ACCENT = 'hsl(160 84% 39%)';
const ICON_ON = '#fafafa';
const ICON_OFF = '#a3a3a3';
const ICON_SIZE = 20;

/** Slot geometry, exported so the sliding marker in NavIslands matches it. */
export const DEST_WIDTH = 46;
export const DEST_HEIGHT = 42;

// Matches the marker's travel so the glyph lights up as the plate arrives.
const DURATION = 260;

type NavDestinationButtonProps = {
  destination: NavDestination;
  active: boolean;
  /** Unread marker in the corner — Social wears it when requests are waiting. */
  alert?: boolean;
  onPress: () => void;
};

/**
 * One destination in the centre island. The active plate is not drawn here: it
 * is a single marker that slides between slots (NavIslands), so this only has to
 * tween its glyph from dim to lit as the marker passes.
 *
 * Two copies of the glyph is the cheap way to tween a stroke colour — lucide
 * takes `color` as a plain prop, which Reanimated cannot drive.
 */
export function NavDestinationButton({ destination, active, alert, onPress }: NavDestinationButtonProps) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: DURATION });
  }, [active, progress]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const litStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={destination.label}
      style={styles.button}
    >
      <Animated.View style={dimStyle}>{destination.icon(ICON_OFF, ICON_SIZE)}</Animated.View>
      <Animated.View style={[styles.overlay, litStyle]} pointerEvents="none">
        {destination.icon(ICON_ON, ICON_SIZE)}
      </Animated.View>
      {alert && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: DEST_WIDTH, height: DEST_HEIGHT, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: ACCENT,
    borderWidth: 1.5,
    borderColor: '#161616',
  },
});
