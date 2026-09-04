import { useCallback, useState } from 'react';
import { Platform, useWindowDimensions, type LayoutChangeEvent, type ViewStyle } from 'react-native';

// Web/desktop layout tier. The app is phone-first everywhere else; these are the
// only knobs that let a screen opt into the wide-viewport variant (sidebar nav,
// centred max-width column, hover affordances) instead of being a stretched
// phone UI on a 1440p monitor.

// Matches tailwind's default scale, plus the two ultrawide steps the poster
// grids need (a 5-column grid on a 2560px monitor gives 500px posters).
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536, '3xl': 1920, '4xl': 2400 } as const;

// Below this the web build keeps the phone layout (bottom tabs, full-bleed
// content) - it's also roughly where a landscape tablet stops feeling like a
// phone. Native never crosses into desktop mode: RN tablets keep bottom tabs.
export const DESKTOP_MIN_WIDTH = BREAKPOINTS.lg;

// Content column caps. Full-bleed text/forms are unreadable past ~90 characters
// and poster grids stop looking like a grid once the cards get huge, so every
// desktop screen funnels through one of these.
export const MAX_W = {
  /** Poster grids and discovery feeds - wide, but not edge-to-edge on ultrawide. */
  grid: 1800,
  /** Movie detail / stats - two-column reading width. */
  detail: 1180,
  /** Settings, friends, single-column prose. */
  text: 920,
  /** Auth card, dialogs. */
  form: 460,
} as const;

/** Desktop-web sidebar widths (also the horizontal offset content sits after). */
export const SIDEBAR_WIDTH = 232;
export const SIDEBAR_WIDTH_COLLAPSED = 68;

export const isWeb = Platform.OS === 'web';

/** True only on web viewports wide enough for the desktop shell. */
export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return isWeb && width >= DESKTOP_MIN_WIDTH;
}

/**
 * Mouse-hover state, no-op off web. `bind` spreads onto a Pressable/View so the
 * caller can drive its own hover styling (RN has no `:hover`).
 */
export function useHover() {
  const [hovered, setHovered] = useState(false);
  const bind = isWeb
    ? { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }
    : {};
  return { hovered: isWeb && hovered, bind } as const;
}

/**
 * Centres a ScrollView's *content* in a capped column while the scroll view
 * itself stays full width - so the scrollbar sits at the window edge where a
 * desktop user looks for it, instead of inside the content column.
 * Returns undefined off desktop, leaving phone layout byte-identical.
 */
export function useCenteredContentStyle(maxWidth: number = MAX_W.text): ViewStyle | undefined {
  const isDesktop = useIsDesktop();
  if (!isDesktop) return undefined;
  return { width: '100%', maxWidth, marginHorizontal: 'auto' };
}

/**
 * CSS transition for hover/press affordances, undefined off web. react-native-web
 * honours the `transition*` style props but React Native's ViewStyle type has no
 * such keys, hence the cast - it's the one place we lie to the type system so
 * hover states can animate instead of snapping.
 */
export function webTransition(properties = 'transform', duration = '160ms'): ViewStyle | undefined {
  if (!isWeb) return undefined;
  return { transitionProperty: properties, transitionDuration: duration } as unknown as ViewStyle;
}

/**
 * Width of the element this is attached to, not of the window. Grid column
 * counts have to be derived from the space the grid actually gets: with a
 * 232px sidebar and an 1800px content cap, window width overshoots by hundreds
 * of pixels and the grid renders too many columns.
 *
 * Falls back to window width for the first frame (correct on phones, where the
 * two are the same, and close enough elsewhere for one frame).
 */
export function useMeasuredWidth() {
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setMeasured((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, []);

  return { width: measured || windowWidth, onLayout } as const;
}
