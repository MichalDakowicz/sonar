import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

// Consistent section chrome for the Settings screen (icon + uppercase label +
// body). Keeps each control file focused on its own logic (doc 10 small files).
export function SettingsSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function SettingLabel({ title, description }: { title: string; description?: string }) {
  return (
    <View className="gap-1">
      <Text className="text-base font-semibold text-foreground">{title}</Text>
      {!!description && <Text className="text-xs text-muted-foreground">{description}</Text>}
    </View>
  );
}
