import { useColorScheme } from 'nativewind';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SHEET_HANDLE_HEIGHT, resolveSnapPoints, type SheetHandle, type SheetProps } from '@/components/ui/sheetTypes';
import { isWeb } from '@/hooks/useResponsive';

/**
 * Phone bottom sheet, built on React Native's own Modal + Animated.
 *
 * This replaced @gorhom/bottom-sheet, under which *no* sheet in the app could
 * scroll its content on device. gorhom routes the drag through
 * react-native-gesture-handler and hands it to a scrollable only when that
 * scrollable is one of its own wrappers, wired to the sheet's gesture context.
 * On this stack (RN 0.86 new architecture + Reanimated 4 + RNGH 2.32) that
 * handoff never happened, so the sheet swallowed every vertical pan and lists
 * inside it sat frozen.
 *
 * The fix is structural, not a workaround: the drag gesture lives ONLY on the
 * grab handle, so it can never contend with content. Everything below the
 * handle is ordinary React Native, which means a plain ScrollView / FlatList /
 * FlashList scrolls exactly as it does anywhere else in the app.
 *
 * Sizing note that matters: the panel is exactly as tall as its *current* snap
 * point, never the tallest one. Sizing it to the tallest and sliding it down to
 * reveal less (the obvious trick, since it makes the whole animation a native
 * transform) silently breaks scrolling at any shorter snap point — the inner
 * list is handed the full height, so it believes everything fits and never
 * overflows, while the surplus hangs off the bottom of the screen unreachable.
 */
const OPEN_DURATION = 260;
const CLOSE_DURATION = 200;
/** Past this fraction of the current snap point, a release closes the sheet. */
const DISMISS_FRACTION = 0.4;
/** Downward fling that dismisses regardless of distance travelled. */
const DISMISS_VELOCITY = 0.8;

export const SheetPanel = forwardRef<SheetHandle, SheetProps>(function SheetPanel(
  { children, snapPoints = ['50%'], onDismiss, onChange, contentHeight },
  ref,
) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme !== 'light';

  // Keyed on the *contents* of snapPoints, not its identity: every call site
  // passes an inline array literal, so a reference dep would rebuild `heights`
  // — and every callback derived from it — on each parent render.
  const snapKey = snapPoints.map(String).join('|');
  const heights = useMemo(() => resolveSnapPoints(snapKey.split('|'), windowHeight), [snapKey, windowHeight]);
  const tallest = heights.length - 1;

  const [visible, setVisible] = useState(false);
  // Drives the panel's height, so it re-renders on a snap change. Mirrored into
  // a ref because the pan responder and imperative handle read it outside render.
  const [activeIndex, setActiveIndex] = useState(-1);
  const indexRef = useRef(-1);

  // The snap point is a ceiling, not a target: a sheet that declares its
  // content height shrinks to fit rather than rendering with the surplus empty.
  const snapHeight = heights[Math.max(0, activeIndex)];
  const height =
    contentHeight != null && contentHeight > 0
      ? Math.min(contentHeight + SHEET_HANDLE_HEIGHT + insets.bottom, snapHeight)
      : snapHeight;
  // Slide distance and drag maths must use the rendered height, not the snap.
  const heightRef = useRef(height);
  useEffect(() => {
    heightRef.current = height;
  }, [height]);

  // 0 = fully shown, `height` = fully off the bottom edge. Transform only, so
  // open/close/drag all run on the native driver without relayout per frame.
  const translateY = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const setIndex = useCallback((index: number) => {
    indexRef.current = index;
    setActiveIndex(index);
  }, []);

  const slideTo = useCallback(
    (offset: number, duration: number, onDone?: () => void) => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: offset,
          duration,
          easing: offset > 0 ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, { toValue: offset > 0 ? 0 : 1, duration, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onDone?.();
      });
    },
    [translateY, backdrop],
  );

  const present = useCallback(() => {
    if (indexRef.current >= 0) return;
    setIndex(0);
    translateY.setValue(heightRef.current);
    backdrop.setValue(0);
    setVisible(true);
    onChange?.(0);
  }, [setIndex, translateY, backdrop, onChange]);

  const dismiss = useCallback(() => {
    if (indexRef.current < 0) return;
    setIndex(-1);
    slideTo(heightRef.current, CLOSE_DURATION, () => {
      setVisible(false);
      onDismiss?.();
    });
    onChange?.(-1);
  }, [setIndex, slideTo, onDismiss, onChange]);

  /**
   * Resize to a snap point. The height change lands in one frame rather than
   * animating: the alternative is a JS-driven height animation, which relayouts
   * the content on every frame of every open and close.
   */
  const applyIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, tallest));
      translateY.setValue(0);
      setIndex(clamped);
      return clamped;
    },
    [tallest, translateY, setIndex],
  );

  const snapToIndex = useCallback(
    (index: number) => {
      if (indexRef.current < 0) return;
      onChange?.(applyIndex(index));
    },
    [applyIndex, onChange],
  );

  // Run the entry animation only once the Modal has actually mounted, otherwise
  // the first frame renders at the open position and the slide is invisible.
  // Guarded on the closed->open edge: an inline onChange/onDismiss prop gives
  // these callbacks a new identity on every parent render, and without the guard
  // that would re-run the animation mid-drag and yank the sheet back.
  const wasVisible = useRef(false);
  useEffect(() => {
    if (!visible) {
      wasVisible.current = false;
      return;
    }
    if (wasVisible.current) return;
    wasVisible.current = true;
    slideTo(0, OPEN_DURATION);
  }, [visible, slideTo]);

  /**
   * Grow to the tallest snap point while the keyboard is up, and drop back when
   * it goes away — gorhom's `keyboardBehavior="extend"` +
   * `keyboardBlurBehavior="restore"`, which the sheets were written against.
   *
   * Deliberately silent: this does NOT fire onChange. Consumers treat an index
   * >= 0 as "the sheet just opened" (FavoritesEditorSheet re-seeds its draft
   * there), so announcing a keyboard resize would discard in-progress edits the
   * moment someone tapped the search field.
   */
  const restoreIndex = useRef<number | null>(null);
  useEffect(() => {
    if (isWeb) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = () => {
      if (indexRef.current < 0 || indexRef.current >= tallest) return;
      restoreIndex.current = indexRef.current;
      applyIndex(tallest);
    };
    const onHide = () => {
      const previous = restoreIndex.current;
      restoreIndex.current = null;
      if (previous == null || indexRef.current < 0) return;
      applyIndex(previous);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [tallest, applyIndex]);

  useImperativeHandle(
    ref,
    () => ({
      present,
      dismiss,
      close: dismiss,
      forceClose: dismiss,
      collapse: () => snapToIndex(0),
      expand: () => snapToIndex(tallest),
      snapToIndex,
      snapToPosition: () => {},
    }),
    [present, dismiss, snapToIndex, tallest],
  );

  // Mobile web has an Escape key even without a mouse.
  useEffect(() => {
    if (!isWeb || !visible || typeof window === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, dismiss]);

  // Handle-only drag. Bound to the grab bar alone, so content keeps its own
  // gestures — the whole reason lists scroll again.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_event, gesture) => {
          // Downward drag only; upward is handled on release by snapping.
          translateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_event, gesture) => {
          const current = heightRef.current;
          const visibleHeight = current - Math.max(0, gesture.dy);

          if (gesture.vy > DISMISS_VELOCITY || visibleHeight < current * DISMISS_FRACTION) {
            dismiss();
            return;
          }

          // A decisive drag up past the halfway mark to the next snap point
          // expands; anything else settles back where it was.
          let nearest = Math.max(0, indexRef.current);
          if (gesture.dy < -40 && nearest < tallest) nearest += 1;
          applyIndex(nearest);
        },
      }),
    [tallest, translateY, applyIndex, dismiss],
  );

  return (
    // Both translucent flags: the app itself runs edge-to-edge
    // (android/gradle.properties edgeToEdgeEnabled=true), but a Modal is its own
    // window and is not edge-to-edge unless told. Without these the window stops
    // above the navigation bar while useSafeAreaInsets still reports that bar's
    // inset from the activity, so the padding below is applied twice and the
    // content sits visibly too high.
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        // Android resizes the window itself (windowSoftInputMode=adjustResize);
        // padding here on top of that would shift the sheet twice.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdrop }]}>
          <Pressable onPress={dismiss} accessibilityLabel="Close sheet" style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={{
            height,
            transform: [{ translateY }],
            backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'hidden',
          }}
        >
          <View
            {...panResponder.panHandlers}
            style={{ height: SHEET_HANDLE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? '#404040' : '#d4d4d4' }} />
          </View>
          <View style={{ flex: 1, paddingBottom: insets.bottom }}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
});
