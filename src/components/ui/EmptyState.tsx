import { Inbox } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

// Doc 04 issue K - shared empty-state UI (e.g. "No perfect scores yet", empty library).
type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      {icon ?? <Inbox size={40} color="hsl(0 0% 45%)" />}
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
      {!!description && <Text className="text-center text-sm text-muted-foreground">{description}</Text>}
      {action}
    </View>
  );
}
