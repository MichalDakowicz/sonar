import { Check, Plus, Star } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

type ShareActionsProps = {
  added: boolean;
  pending: boolean;
  onAdd: () => void;
  onRate: () => void;
  onAddAndRate: () => void;
};

/**
 * The three things a share can end in.
 *
 * Add and Rate are separate because they are separate in the data too: a rating
 * hangs off the release whether or not you own a copy. "Add and rate" is the
 * common case for a record you just bought, so it leads.
 */
export function ShareActions({ added, pending, onAdd, onRate, onAddAndRate }: ShareActionsProps) {
  const dim = pending;

  return (
    <View className="gap-2 border-t border-border pt-4">
      <Pressable
        onPress={onAddAndRate}
        disabled={dim}
        className="flex-row items-center justify-center gap-2 rounded-full bg-primary py-3 active:opacity-80"
        style={{ opacity: dim ? 0.5 : 1 }}
      >
        {pending ? <ActivityIndicator size="small" color="#fff" /> : <Star size={16} color="#fff" />}
        <Text className="font-semibold text-primary-foreground">{added ? 'Rate it' : 'Add and rate'}</Text>
      </Pressable>

      <View className="flex-row gap-2">
        <Pressable
          onPress={onAdd}
          disabled={dim || added}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border py-3 active:opacity-80"
          style={{ opacity: dim || added ? 0.5 : 1 }}
        >
          {added ? <Check size={16} color={COLORS.accent} /> : <Plus size={16} color={COLORS.foreground} />}
          <Text className="font-medium text-foreground">{added ? 'On your shelf' : 'Add only'}</Text>
        </Pressable>

        <Pressable
          onPress={onRate}
          disabled={dim}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border py-3 active:opacity-80"
          style={{ opacity: dim ? 0.5 : 1 }}
        >
          <Star size={16} color={COLORS.foreground} />
          <Text className="font-medium text-foreground">Rate only</Text>
        </Pressable>
      </View>
    </View>
  );
}
