import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export type SegmentedOption<T extends string> = { value: T; label: string; icon?: ReactNode };

// Equal-width option grid used by the theme, privacy, and card-size controls -
// the RN stand-in for legacy's radio-button card rows. Highlights the active
// option in the app's blue accent.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
  disabled,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: number;
  disabled?: boolean;
}) {
  const basis: `${number}%` = `${Math.floor(100 / columns) - 2}%`;
  return (
    <View className="flex-row flex-wrap gap-3">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            disabled={disabled}
            onPress={() => onChange(opt.value)}
            className="items-center justify-center gap-2 rounded-xl border-2 px-3 py-4"
            style={{
              flexBasis: basis,
              flexGrow: 1,
              borderColor: active ? 'hsl(160 84% 39%)' : 'hsl(0 0% 20%)',
              backgroundColor: active ? 'hsla(160,84%,39%,0.16)' : 'transparent',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {opt.icon}
            <Text className={active ? 'text-sm font-bold text-foreground' : 'text-sm font-semibold text-muted-foreground'}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
