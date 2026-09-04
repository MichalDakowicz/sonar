import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';

import { resolveSnapPoints, type SheetHandle, type SheetProps } from '@/components/ui/sheetTypes';

const DESKTOP_MAX_WIDTH = 560;
const DESKTOP_MIN_HEIGHT = 280;

/**
 * Desktop-web counterpart to SheetPanel: a centred modal dialog. A sheet that
 * slides up from the bottom edge of a 27" monitor is a phone gesture pretending
 * to work with a mouse — this gets a backdrop click, an X, and Escape.
 *
 * Sheet content is written against a definite height (`flex-1` bodies, internal
 * lists), so the dialog takes the tallest snap point: there's no drag handle to
 * expand with, so the roomiest option is the right one.
 */
export const SheetDialog = forwardRef<SheetHandle, SheetProps>(function SheetDialog(
  { children, snapPoints = ['50%'], onDismiss, onChange, maxWidth = DESKTOP_MAX_WIDTH, contentHeight },
  ref,
) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme !== 'light';
  const { height: windowHeight } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  // Mirrors `visible` for the guards below, so a stray dismiss() on an already
  // closed dialog can't fire onDismiss a second time.
  const openRef = useRef(false);

  const heights = resolveSnapPoints(snapPoints, windowHeight);
  const tallest = heights[heights.length - 1];
  // A sheet that knows its content height shrinks to fit, with the tallest snap
  // point as the ceiling - same contract as SheetPanel.
  const fitted = contentHeight != null && contentHeight > 0 ? Math.min(contentHeight, tallest) : tallest;
  const height = Math.max(fitted, DESKTOP_MIN_HEIGHT);

  const present = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    setVisible(true);
    onChange?.(0);
  }, [onChange]);

  const dismiss = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setVisible(false);
    onChange?.(-1);
    onDismiss?.();
  }, [onChange, onDismiss]);

  useImperativeHandle(
    ref,
    () => ({
      present,
      dismiss,
      close: dismiss,
      forceClose: dismiss,
      collapse: () => {},
      expand: () => {},
      // No-op: the dialog already sits at its tallest snap point.
      snapToIndex: () => {},
      snapToPosition: () => {},
    }),
    [present, dismiss],
  );

  useEffect(() => {
    if (!visible || typeof window === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, dismiss]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View className="flex-1 items-center justify-center p-6">
        {/* Backdrop is a sibling *behind* the card, not its parent: on web a
            click inside the card would otherwise bubble up and close it. */}
        <Pressable
          onPress={dismiss}
          accessibilityLabel="Close dialog"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}
        />
        <View
          className="overflow-hidden rounded-2xl border border-border"
          style={{ width: '100%', maxWidth, height, backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }}
        >
          <View className="flex-1">{children}</View>
          <Pressable onPress={dismiss} accessibilityLabel="Close" className="absolute right-3 top-3 z-10 rounded-full bg-black/45 p-2">
            <X size={16} color={isDark ? '#fafafa' : '#0a0a0a'} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});
