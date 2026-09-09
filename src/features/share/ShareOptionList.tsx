import { Check, Disc3, Star } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { SubjectArtwork } from '@/features/ratings/SubjectArtwork';
import type { ShareOption } from '@/features/share/useShareOptions';
import { candidateByline } from '@/lib/spotifySubjects';
import { COLORS } from '@/theme/colors';

type ShareOptionListProps = {
  options: ShareOption[];
  loading: boolean;
  selectedKey: string | null;
  onSelect: (option: ShareOption) => void;
  isAdded: (key: string) => boolean;
  scoreFor: (key: string) => number | null;
  emptyTitle: string;
  emptyDescription: string;
};

/**
 * What the active tab offers, one of which the buttons below will act on.
 *
 * A row says whether it is already on the shelf and whether it is already
 * rated, because that is what decides which action you want — the whole point
 * of the sheet is not having to open the app first to find out.
 */
export function ShareOptionList({
  options,
  loading,
  selectedKey,
  onSelect,
  isAdded,
  scoreFor,
  emptyTitle,
  emptyDescription,
}: ShareOptionListProps) {
  if (loading && options.length === 0) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (options.length === 0) {
    return <EmptyState icon={<Disc3 size={32} color={COLORS.mutedDeep} />} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <View className="gap-2">
      {options.map((option) => {
        const { candidate } = option;
        const selected = candidate.key === selectedKey;
        const added = isAdded(candidate.key);
        const score = scoreFor(candidate.key);
        const byline = candidateByline(candidate);
        return (
          <Pressable
            key={candidate.key}
            onPress={() => onSelect(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            className="flex-row items-center gap-3 rounded-xl border bg-card p-2.5 active:opacity-80"
            style={{
              borderColor: selected ? COLORS.accent : 'hsl(0 0% 20%)',
              backgroundColor: selected ? COLORS.accentSoft : undefined,
            }}
          >
            <SubjectArtwork subject={candidate.subject} uri={candidate.coverUrl} size={56} />

            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                {candidate.title}
              </Text>
              <Text numberOfLines={1} className="text-xs text-muted-foreground">
                {[byline, candidate.context].filter(Boolean).join(' • ')}
              </Text>
            </View>

            <View className="items-end gap-1">
              {added && (
                <View className="flex-row items-center gap-1">
                  <Check size={13} color={COLORS.accent} />
                  <Text className="text-[11px] font-semibold text-primary">On shelf</Text>
                </View>
              )}
              {score != null && (
                <View className="flex-row items-center gap-1">
                  <Star size={13} color={COLORS.accent} fill={COLORS.accent} />
                  <Text className="text-[11px] font-semibold text-primary">{score.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
