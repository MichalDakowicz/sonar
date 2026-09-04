import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { NavIslands } from '@/components/layout/NavIslands';
import { CoverImage } from '@/components/media/CoverImage';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { NestedHeader } from '@/features/social/NestedHeader';
import { useAlbums } from '@/hooks/useAlbums';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { MAX_W } from '@/hooks/useResponsive';
import { orderBetween, shelfOrder } from '@/lib/collectionSort';
import { artistsToDisplayString } from '@/lib/utils';
import { COLORS } from '@/theme/colors';
import type { Album } from '@/types/album';

/**
 * Shelf order — the hand-arranged sequence the collection uses when sorted by
 * "Shelf order".
 *
 * Buttons rather than drag: the collection grid is virtualized, and a drag
 * gesture inside a recycling list fights the list's own scroll for every pixel.
 * A move here writes one row (a sparse midpoint from `orderBetween`), so
 * rearranging a large shelf never rewrites the whole thing.
 */
export default function Reorder() {
  const { albums, loading, updateAlbum } = useAlbums();
  const { show } = useToast();
  const navBarSpace = useNavBarSpace();
  const [busyId, setBusyId] = useState<string | null>(null);

  const ordered = useMemo(() => [...albums].sort((a, b) => shelfOrder(a) - shelfOrder(b)), [albums]);

  /** Writes the moved row's new order from where it lands between its neighbours. */
  const move = async (album: Album, target: number) => {
    const from = ordered.findIndex((entry) => entry.id === album.id);
    const to = Math.max(0, Math.min(target, ordered.length - 1));
    if (from === to) return;

    const without = ordered.filter((entry) => entry.id !== album.id);
    const previous = without[to - 1];
    const next = without[to];

    setBusyId(album.id);
    try {
      // Silent: a nudge up the shelf is not something a friend's feed wants.
      await updateAlbum(album.id, { customOrder: orderBetween(previous, next) }, { silent: true });
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not move that record');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <NestedHeader title="Reorder shelf" />

      <ContentShell fill maxWidth={MAX_W.text}>
        {loading ? (
          <LoadingState label="Loading your shelf…" />
        ) : ordered.length === 0 ? (
          <EmptyState title="Nothing to reorder" description="Add a few records first." />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-2 px-4 pt-3"
            contentContainerStyle={{ paddingBottom: navBarSpace + 16 }}
          >
            <Text className="pb-1 text-xs text-muted-foreground">
              This order applies when the collection is sorted by shelf order.
            </Text>

            {ordered.map((album, index) => (
              <View key={album.id} className="flex-row items-center gap-3 rounded-xl border border-border bg-card/50 p-2.5">
                <Text className="w-6 text-right text-xs text-muted-foreground">{index + 1}</Text>
                <View className="h-11 w-11 overflow-hidden rounded-md bg-secondary">
                  <CoverImage uri={album.coverUrl} iconSize={14} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                    {album.title}
                  </Text>
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">
                    {artistsToDisplayString(album.artist)}
                  </Text>
                </View>

                {busyId === album.id ? (
                  <ActivityIndicator size="small" color={COLORS.accent} />
                ) : (
                  <View className="flex-row items-center">
                    <MoveButton label="Move to top" disabled={index === 0} onPress={() => move(album, 0)}>
                      <ArrowUpToLine size={15} color={index === 0 ? '#3f3f46' : COLORS.muted} />
                    </MoveButton>
                    <MoveButton label="Move up" disabled={index === 0} onPress={() => move(album, index - 1)}>
                      <ArrowUp size={16} color={index === 0 ? '#3f3f46' : COLORS.foreground} />
                    </MoveButton>
                    <MoveButton
                      label="Move down"
                      disabled={index === ordered.length - 1}
                      onPress={() => move(album, index + 1)}
                    >
                      <ArrowDown size={16} color={index === ordered.length - 1 ? '#3f3f46' : COLORS.foreground} />
                    </MoveButton>
                    <MoveButton
                      label="Move to bottom"
                      disabled={index === ordered.length - 1}
                      onPress={() => move(album, ordered.length - 1)}
                    >
                      <ArrowDownToLine size={15} color={index === ordered.length - 1 ? '#3f3f46' : COLORS.muted} />
                    </MoveButton>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </ContentShell>

      <NavIslands />
    </View>
  );
}

function MoveButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={4}
      className="h-10 w-9 items-center justify-center active:opacity-60"
    >
      {children}
    </Pressable>
  );
}
