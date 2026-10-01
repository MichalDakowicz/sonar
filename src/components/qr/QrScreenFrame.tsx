import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Wide enough for a code to be scanned across a table, narrow enough to stay a phone column on the web. */
const COLUMN = 420;

type QrScreenFrameProps = {
  title: string;
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
};

/**
 * The page the two QR screens share: a back pill, a title, one centred column. It
 * is not the nav islands' screen shell on purpose — a camera, or a code to be read
 * across a table, wants the whole page and nothing floating over it.
 */
export function QrScreenFrame({ title, backLabel, onBack, children }: QrScreenFrameProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="flex-grow items-center gap-6 px-6"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full flex-row" style={{ maxWidth: COLUMN }}>
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            className="rounded-full border border-border px-4 py-2 active:opacity-80"
          >
            <Text className="text-sm font-medium text-foreground">{backLabel}</Text>
          </Pressable>
        </View>

        <Text
          accessibilityRole="header"
          className="w-full text-center text-2xl font-bold tracking-tight text-foreground"
          style={{ maxWidth: COLUMN }}
        >
          {title}
        </Text>

        <View className="w-full gap-6" style={{ maxWidth: COLUMN }}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
