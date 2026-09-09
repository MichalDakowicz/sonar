import { Pressable, ScrollView, Text } from 'react-native';

import type { ShareTab, ShareTabKind } from '@/features/share/useShareResolution';
import { COLORS } from '@/theme/colors';

type ShareTabBarProps = {
  tabs: ShareTab[];
  active: ShareTabKind | null;
  onChange: (kind: ShareTabKind) => void;
};

/**
 * What to act on: the shared release, its single, or its artist's catalogue.
 *
 * Scrolls rather than wrapping — a shared song offers four choices, and a tab
 * row that reflows to two lines reads as two groups of controls instead of one.
 */
export function ShareTabBar({ tabs, active, onChange }: ShareTabBarProps) {
  if (tabs.length < 2) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-2 pr-4"
      keyboardShouldPersistTaps="handled"
    >
      {tabs.map((tab) => {
        const selected = tab.kind === active;
        return (
          <Pressable
            key={tab.kind}
            onPress={() => onChange(tab.kind)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className="rounded-full border px-4 py-2 active:opacity-80"
            style={{
              borderColor: selected ? COLORS.accent : 'hsl(0 0% 20%)',
              backgroundColor: selected ? COLORS.accentSoft : 'transparent',
            }}
          >
            <Text
              className={selected ? 'text-xs font-bold text-primary' : 'text-xs font-semibold text-muted-foreground'}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
