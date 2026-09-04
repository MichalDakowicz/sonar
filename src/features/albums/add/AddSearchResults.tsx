import { Image } from 'expo-image';
import { Check, Disc3, Plus } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { artistsToDisplayString, releaseYear } from '@/lib/utils';
import type { SpotifyAlbum } from '@/lib/spotify';
import { COLORS } from '@/theme/colors';

type AddSearchResultsProps = {
  results: SpotifyAlbum[];
  loading: boolean;
  query: string;
  unconfigured: boolean;
  isAdded: (albumKey: string) => boolean;
  pendingKey: string | null;
  onSelect: (release: SpotifyAlbum) => void;
  onAdd: (release: SpotifyAlbum) => void;
};

/**
 * Spotify hits as pickable rows. Tapping the row opens the release (where it
 * can be rated whether or not it is owned); tapping the + puts it straight on
 * the shelf with the draft's status and formats.
 */
export function AddSearchResults({
  results,
  loading,
  query,
  unconfigured,
  isAdded,
  pendingKey,
  onSelect,
  onAdd,
}: AddSearchResultsProps) {
  if (unconfigured) {
    return (
      <EmptyState
        icon={<Disc3 size={36} color={COLORS.mutedDeep} />}
        title="Spotify search is off"
        description="Add EXPO_PUBLIC_SPOTIFY_CLIENT_ID and _SECRET to .env to look albums up, or add one by hand below."
      />
    );
  }

  if (loading && results.length === 0) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (query.trim().length > 1 && results.length === 0) {
    return (
      <EmptyState
        icon={<Disc3 size={36} color={COLORS.mutedDeep} />}
        title="No albums found"
        description="Check the spelling, paste a Spotify link, or add it by hand."
      />
    );
  }

  return (
    <View className="gap-2">
      {results.map((release) => {
        const added = isAdded(release.albumKey);
        const pending = pendingKey === release.albumKey;
        return (
          <Pressable
            key={release.spotifyId}
            onPress={() => onSelect(release)}
            className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-2.5 active:opacity-80"
          >
            <View className="h-14 w-14 overflow-hidden rounded-md bg-secondary">
              {release.coverUrl ? (
                <Image source={{ uri: release.coverUrl }} style={{ width: 56, height: 56 }} contentFit="cover" transition={120} />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Disc3 size={20} color={COLORS.mutedDeep} />
                </View>
              )}
            </View>

            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                {release.title}
              </Text>
              <Text numberOfLines={1} className="text-xs text-muted-foreground">
                {[artistsToDisplayString(release.artist), releaseYear(release.releaseDate)].filter(Boolean).join(' • ')}
              </Text>
            </View>

            <Pressable
              onPress={() => (added ? undefined : onAdd(release))}
              disabled={added || pending}
              accessibilityLabel={added ? `${release.title} is already on your shelf` : `Add ${release.title}`}
              hitSlop={8}
              className="rounded-full p-2.5"
              style={{ backgroundColor: added ? 'rgba(16,185,129,0.16)' : COLORS.accentSoft }}
            >
              {pending ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : added ? (
                <Check size={16} color={COLORS.accent} />
              ) : (
                <Plus size={16} color={COLORS.accent} />
              )}
            </Pressable>
          </Pressable>
        );
      })}
    </View>
  );
}
