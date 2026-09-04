import { AlertTriangle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// Doc 04 issue K - shared error UI for react-query error states.
type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <AlertTriangle size={40} color="hsl(0 62.8% 50%)" />
      <Text className="text-center text-sm text-muted-foreground">{message}</Text>
      {!!onRetry && (
        <Pressable onPress={onRetry} className="rounded-full border border-border px-4 py-2 active:opacity-80">
          <Text className="text-foreground">Try again</Text>
        </Pressable>
      )}
    </View>
  );
}
