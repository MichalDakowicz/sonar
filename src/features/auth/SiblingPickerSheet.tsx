import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PingApp } from '@/lib/pingApps';

import type { InstalledSibling } from './useInstalledSiblings';

type SiblingPickerSheetProps = {
  open: boolean;
  siblings: InstalledSibling[];
  onPick: (app: PingApp) => void;
  onClose: () => void;
};

const ICON = { width: 32, height: 32, borderRadius: 16 };

/** Share of the window the list may take before it scrolls. */
const LIST_MAX_HEIGHT = 0.5;

/**
 * Every other Ping app on this phone, one row each (PING.md §9.13). Opens from
 * the single "Choose an app" button, so the sign-in screen stays the same size
 * however many apps the family grows to — the list scrolls instead.
 *
 * Self-contained on purpose: the sign-in core is identical in every Ping app and
 * the apps' own sheet primitive is not, so this takes nothing from `ui/`.
 */
export function SiblingPickerSheet({ open, siblings, onPick, onClose }: SiblingPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        {/* The sheet swallows its own taps so a press inside does not dismiss. */}
        <Pressable onPress={() => {}} accessible={false}>
          <Animated.View entering={SlideInDown.duration(240)}>
            {/* The ground is on a plain View: className does not reach a reanimated view on web. */}
            <View
              className="rounded-t-[20px] border-t border-border bg-popover px-6 pt-5"
              style={{ paddingBottom: insets.bottom + 24 }}
            >
              <View className="mx-auto mb-4 h-1 w-9 rounded-full bg-border" />
              <Text className="text-lg font-bold text-foreground">Continue with</Text>
              <Text className="mb-4 mt-2 text-sm text-muted-foreground">It opens for a moment, then brings you back.</Text>
              <ScrollView
                style={{ maxHeight: windowHeight * LIST_MAX_HEIGHT }}
                contentContainerClassName="gap-2"
                showsVerticalScrollIndicator={false}
              >
                {siblings.map(({ app, icon }) => (
                  <Pressable
                    key={app.key}
                    accessibilityRole="button"
                    accessibilityLabel={`Continue with ${app.name}`}
                    onPress={() => onPick(app)}
                    className="flex-row items-center gap-3 rounded-xl border border-border px-3.5 py-3 active:opacity-70"
                  >
                    {icon ? <Image source={{ uri: icon }} style={ICON} /> : <View style={ICON} className="bg-secondary" />}
                    <Text className="text-[14.5px] text-foreground">{app.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
