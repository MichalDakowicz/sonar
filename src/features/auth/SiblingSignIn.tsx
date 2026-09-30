import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import type { PingApp } from '@/lib/pingApps';

import type { InstalledSibling } from './useInstalledSiblings';

type SiblingSignInProps = {
  siblings: InstalledSibling[];
  disabled: boolean;
  onPick: (app: PingApp) => void;
};

const ICON = { width: 24, height: 24, borderRadius: 12 };

/**
 * One tap for someone already signed in to another Ping app on this phone
 * (PING.md §9.13): the sibling opens for a moment and hands a sign-in back.
 * Renders nothing when no sibling is installed — every web and iOS build.
 */
export function SiblingSignIn({ siblings, disabled, onPick }: SiblingSignInProps) {
  if (siblings.length === 0) return null;

  return (
    <View className="gap-3">
      <Text className="text-center text-xs text-muted-foreground">Already signed in to another Ping app?</Text>
      <View className="flex-row flex-wrap gap-2">
        {siblings.map(({ app, icon }) => (
          <Pressable
            key={app.key}
            accessibilityRole="button"
            accessibilityLabel={`Continue with ${app.name}`}
            onPress={() => onPick(app)}
            disabled={disabled}
            className="min-w-[45%] flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border py-3 active:opacity-80"
            style={{ opacity: disabled ? 0.5 : 1 }}
          >
            {icon && <Image source={{ uri: icon }} style={ICON} />}
            {/* Two to a row once there are several, and "Continue with Pulsar"
                does not fit in half a phone. */}
            <Text className="font-medium text-foreground">
              {siblings.length === 1 ? `Continue with ${app.name}` : app.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="my-1 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-xs text-muted-foreground">OR</Text>
        <View className="h-px flex-1 bg-border" />
      </View>
    </View>
  );
}
