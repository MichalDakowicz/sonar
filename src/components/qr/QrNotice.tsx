import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type Action = { label: string; onPress: () => void };

type QrNoticeProps = {
  title: string;
  body?: string;
  /** A spinner above the words: something is in flight. */
  busy?: boolean;
  primary?: Action;
  secondary?: Action;
};

/** A screen's last word — or its middle one, with `busy`. A title, a line under it, up to two buttons. */
export function QrNotice({ title, body, busy, primary, secondary }: QrNoticeProps) {
  return (
    <View className="items-center gap-5 py-6">
      {busy && <ActivityIndicator size="large" />}
      <View className="items-center gap-2">
        <Text className="text-center text-xl font-semibold text-foreground">{title}</Text>
        {!!body && <Text className="text-center text-sm text-muted-foreground">{body}</Text>}
      </View>

      {(primary || secondary) && (
        <View className="w-full gap-3">
          {primary && (
            <Pressable
              onPress={primary.onPress}
              accessibilityRole="button"
              className="items-center rounded-full bg-primary py-3.5 active:opacity-80"
            >
              <Text className="font-semibold text-primary-foreground">{primary.label}</Text>
            </Pressable>
          )}
          {secondary && (
            <Pressable
              onPress={secondary.onPress}
              accessibilityRole="button"
              className="items-center rounded-full border border-border py-3.5 active:opacity-80"
            >
              <Text className="font-medium text-foreground">{secondary.label}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
