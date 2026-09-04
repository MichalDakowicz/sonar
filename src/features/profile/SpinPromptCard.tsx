import { Clock, Shuffle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

type SpinPromptCardProps = {
  collectionCount: number;
  /** Records you have not logged a listen for in a while. */
  neglectedCount: number;
  onPick: (scope: 'collection' | 'neglected') => void;
};

/**
 * "Put something on" — the picker's entry point, moved here from the legacy top
 * bar where it was an unlabelled shuffle icon nobody found.
 *
 * Two scopes, because the honest answer to "what should I play" is usually one
 * of two questions: anything at all, or something you have been neglecting.
 */
export function SpinPromptCard({ collectionCount, neglectedCount, onPick }: SpinPromptCardProps) {
  if (collectionCount === 0) return null;

  return (
    <View className="mx-4 gap-3 rounded-2xl border border-border bg-card/60 p-4">
      <View className="gap-1">
        <Text className="text-base font-bold text-foreground">What should I put on?</Text>
        <Text className="text-xs text-muted-foreground">Draw a record from the shelf and log it if you play it.</Text>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onPick('collection')}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-primary py-2.5 active:opacity-80"
        >
          <Shuffle size={15} color="#fff" />
          <Text className="text-sm font-semibold text-primary-foreground">Anything ({collectionCount})</Text>
        </Pressable>

        <Pressable
          onPress={() => onPick('neglected')}
          disabled={neglectedCount === 0}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border py-2.5 active:opacity-80"
          style={{ opacity: neglectedCount === 0 ? 0.5 : 1 }}
        >
          <Clock size={15} color={COLORS.foreground} />
          <Text className="text-sm font-medium text-foreground">Neglected ({neglectedCount})</Text>
        </Pressable>
      </View>
    </View>
  );
}
