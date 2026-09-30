import { Pressable, Text, View } from 'react-native';

import type { SignOutScope } from './authActions';

const OPTIONS: { scope: SignOutScope; title: string; detail: string }[] = [
  { scope: 'local', title: 'Just Sonar', detail: 'Your other Ping apps stay signed in' },
  { scope: 'global', title: 'Every Ping app', detail: 'On this phone, your other devices and the web' },
];

type SignOutScopePickerProps = {
  value: SignOutScope;
  onChange: (scope: SignOutScope) => void;
};

/** How far a sign-out reaches (PING.md §9.13). Two segmented options, never a default of "everywhere". */
export function SignOutScopePicker({ value, onChange }: SignOutScopePickerProps) {
  return (
    <View className="gap-2">
      {OPTIONS.map((option) => {
        const active = option.scope === value;
        return (
          <Pressable
            key={option.scope}
            onPress={() => onChange(option.scope)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.title}
            className={`gap-0.5 rounded-xl border px-3.5 py-3 active:opacity-70 ${
              active ? 'border-primary bg-primary/10' : 'border-border'
            }`}
          >
            <Text className={`text-[14.5px] ${active ? 'font-semibold text-primary' : 'text-foreground'}`}>
              {option.title}
            </Text>
            <Text className="text-xs text-muted-foreground">{option.detail}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
