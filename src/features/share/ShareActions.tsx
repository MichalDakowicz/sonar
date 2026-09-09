import { Check, Plus, Star } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

type ShareActionsProps = {
  /** False for a song or an artist: there is no shelf row to write. */
  shelvable: boolean;
  added: boolean;
  pending: boolean;
  onAdd: () => void;
  onRate: () => void;
  onAddAndRate: () => void;
};

/**
 * How a share ends.
 *
 * Add and Rate are separate because they are separate in the data too: a rating
 * hangs off the subject whether or not you own a copy. "Add and rate" is the
 * common case for a record you just bought, so it leads — and it disappears
 * entirely for a song or an artist, where rating is the only thing that exists.
 */
export function ShareActions({ shelvable, added, pending, onAdd, onRate, onAddAndRate }: ShareActionsProps) {
  const dim = pending;

  if (!shelvable) {
    return (
      <View className="gap-2 border-t border-border pt-4">
        <Pressable
          onPress={onRate}
          disabled={dim}
          className="flex-row items-center justify-center gap-2 rounded-full bg-primary py-3 active:opacity-80"
          style={{ opacity: dim ? 0.5 : 1 }}
        >
          <Star size={16} color="#fff" />
          <Text className="font-semibold text-primary-foreground">Rate it</Text>
        </Pressable>
        <Text className="text-center text-[11px] text-muted-foreground">
          Songs and artists are rated, never shelved — the record is on the other tab.
        </Text>
      </View>
    );
  }

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
