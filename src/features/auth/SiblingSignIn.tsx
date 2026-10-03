import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { PingApp } from '@/lib/pingApps';

import { SiblingPickerSheet } from './SiblingPickerSheet';
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
 * One button however many siblings there are — a lone sibling is continued with
 * directly, several open a sheet to choose from. Renders nothing when no sibling
 * is installed — every web and iOS build.
 */
export function SiblingSignIn({ siblings, disabled, onPick }: SiblingSignInProps) {
  const [open, setOpen] = useState(false);
  if (siblings.length === 0) return null;

  const only = siblings.length === 1 ? siblings[0] : null;

  return (
    <View className="gap-3">
      <Text className="text-center text-xs text-muted-foreground">Already signed in to another Ping app?</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={only ? `Continue with ${only.app.name}` : 'Choose a Ping app to continue with'}
        onPress={() => (only ? onPick(only.app) : setOpen(true))}
        disabled={disabled}
        className="flex-row items-center justify-center gap-2 rounded-full border border-border py-3 active:opacity-80"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {only?.icon && <Image source={{ uri: only.icon }} style={ICON} />}
        <Text className="font-medium text-foreground">{only ? `Continue with ${only.app.name}` : 'Choose an app'}</Text>
      </Pressable>
      <SiblingPickerSheet
        open={open}
        siblings={siblings}
        onPick={(app) => {
          setOpen(false);
          onPick(app);
        }}
        onClose={() => setOpen(false)}
      />
      <View className="my-1 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-xs text-muted-foreground">OR</Text>
        <View className="h-px flex-1 bg-border" />
      </View>
    </View>
  );
}
