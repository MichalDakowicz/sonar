import { Check, Disc3, Star } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CoverImage } from '@/components/media/CoverImage';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SpotifyAlbum } from '@/lib/spotify';
import { artistsToDisplayString, releaseYear } from '@/lib/utils';
import { COLORS } from '@/theme/colors';

type ShareReleaseListProps = {
  options: SpotifyAlbum[];
  loading: boolean;
  selectedKey: string | null;
  onSelect: (release: SpotifyAlbum) => void;
  isAdded: (albumKey: string) => boolean;
  scoreFor: (albumKey: string) => number | null;
  emptyTitle: string;
  emptyDescription: string;
};

/**
 * The releases the active tab offers, one of which is what the Add/Rate buttons
 * below will act on.
 *
 * A row says whether it is already on the shelf and whether it is already
 * rated, because that is what decides which of the three actions you want — the
 * whole point of the sheet is not having to open the app to find out.
 */
export function ShareReleaseList({
  options,
  loading,
  selectedKey,
  onSelect,
  isAdded,
  scoreFor,
  emptyTitle,
  emptyDescription,
}: ShareReleaseListProps) {
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
      {options.map((release) => {
        const selected = release.albumKey === selectedKey;
        const added = isAdded(release.albumKey);
        const score = scoreFor(release.albumKey);
        return (
          <Pressable
            key={release.spotifyId}
            onPress={() => onSelect(release)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            className="flex-row items-center gap-3 rounded-xl border bg-card p-2.5 active:opacity-80"
            style={{
              borderColor: selected ? COLORS.accent : 'hsl(0 0% 20%)',
              backgroundColor: selected ? COLORS.accentSoft : undefined,
            }}
          >
            <View className="h-14 w-14 overflow-hidden rounded-md bg-secondary">
              <CoverImage uri={release.coverUrl} iconSize={20} transitionMs={120} />
            </View>

            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                {release.title}
              </Text>
              <Text numberOfLines={1} className="text-xs text-muted-foreground">
                {[artistsToDisplayString(release.artist), releaseYear(release.releaseDate)].filter(Boolean).join(' • ')}
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
