import { useRef } from 'react';
import { Pressable, Text, View, type GestureResponderEvent } from 'react-native';

import { COLORS } from '@/theme/colors';

type RatingSliderProps = {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  max?: number;
};

/**
 * Tap-to-set rating bar: ten discrete targets at half-star steps. React Native
 * has no range input, and ten taps beats a drag for a facet you are answering
 * quickly. Tapping the current value clears the facet, which is the only way to
 * un-answer one.
 */
export function RatingSlider({ value, onChange, step = 0.5, max = 5 }: RatingSliderProps) {
  const stepCount = Math.round(max / step);

  return (
    <View className="flex-row gap-1">
      {Array.from({ length: stepCount }, (_, index) => (index + 1) * step).map((mark) => (
        <Pressable
          key={mark}
          onPress={() => onChange(mark === value ? 0 : mark)}
          accessibilityLabel={`Rate ${mark} out of ${max}`}
          className="h-8 flex-1 items-center justify-center"
        >
          <View
            className="h-1.5 w-full rounded-full"
            style={{ backgroundColor: value >= mark ? COLORS.accent : 'hsl(0 0% 22%)' }}
          />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Continuous drag track for the overall score. The tick row above reads well at
 * coarse half steps but cannot express 0.1 without fifty tap targets, so the
 * overall gets a real drag.
 *
 * Built on the view's own responder props rather than a PanResponder: a
 * PanResponder has to be constructed with the handlers closed over, which means
 * either rebuilding it every render or stashing it in a ref and reading that ref
 * during render. Plain responder props are just props.
 *
 * The track is measured page-relative on each grab (not from onLayout alone) so
 * it stays accurate inside a parent that has since scrolled.
 */
export function RatingSliderPrecise({ value, onChange, step = 0.1, max = 5 }: RatingSliderProps) {
  const trackRef = useRef<View>(null);
  const layout = useRef({ pageX: 0, width: 0 });

  const setFromPageX = (pageX: number) => {
    const { pageX: trackX, width } = layout.current;
    if (width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (pageX - trackX) / width));
    const stepped = Math.round((ratio * max) / step) * step;
    onChange(Math.max(0, Math.min(max, Number(stepped.toFixed(2)))));
  };

  const measure = (then?: () => void) =>
    trackRef.current?.measure((_x, _y, width, _height, pageX) => {
      layout.current = { pageX, width };
      then?.();
    });

  const onGrant = (event: GestureResponderEvent) => {
    const { pageX } = event.nativeEvent;
    measure(() => setFromPageX(pageX));
  };

  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <View className="px-2">
      <View
        ref={trackRef}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onGrant}
        onResponderMove={(event) => setFromPageX(event.nativeEvent.pageX)}
        // Claim the gesture from an ancestor ScrollView, or a horizontal drag on
        // the track scrolls the page instead of moving the score.
        onResponderTerminationRequest={() => false}
        className="h-8 w-full justify-center"
        onLayout={() => measure()}
        accessibilityLabel={`Overall score, ${value.toFixed(1)} out of ${max}`}
      >
        <View className="h-2 overflow-hidden rounded-full bg-secondary">
          <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </View>
        <View
          className="absolute h-5 w-5 rounded-full border-2 border-primary bg-white"
          style={{ left: `${percent}%`, marginLeft: -10, pointerEvents: 'none' }}
        />
      </View>
    </View>
  );
}

export function RatingValue({ value }: { value: number }) {
  return <Text className="text-sm font-semibold text-foreground">{value > 0 ? value.toFixed(1) : '0.0'} / 5</Text>;
}
