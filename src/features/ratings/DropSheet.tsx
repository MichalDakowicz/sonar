import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Disc3, ExternalLink, Trash2 } from 'lucide-react-native';
import { forwardRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Sheet, type BottomSheetModal } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { useAlbumRatings, type RateTarget } from '@/hooks/useAlbumRatings';
import { personalScore } from '@/lib/personalScore';
import { scoreForTier, tierFor, TIERS } from '@/lib/tiers';
import { artistsToDisplayString, releaseYear } from '@/lib/utils';
import { COLORS } from '@/theme/colors';

type DropSheetProps = {
  /** What is being rated. Owning it is never required. */
  target: RateTarget | null;
  onDismiss?: () => void;
};

/**
 * Drop a release into a tier, in one tap.
 *
 * This is the fast path: a tier writes a score (lib/tiers) and nothing else, so
 * rating a stack of albums is six visible buttons rather than six sliders. The
 * facets and the review live on the release page, one tap further in, for when
 * a record deserves the long version.
 */
export const DropSheet = forwardRef<BottomSheetModal, DropSheetProps>(function DropSheet(
  { target, onDismiss },
  ref,
) {
  const router = useRouter();
  const { show } = useToast();
  const { ratingFor, saveRating, removeRating } = useAlbumRatings();

  const existing = target ? ratingFor(target.albumKey) : null;
  const score = personalScore(existing?.ratings);
  const current = tierFor(score);
  const dismiss = () => (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();

  const drop = async (tierId: (typeof TIERS)[number]['id']) => {
    if (!target) return;
    try {
      // Only the overall moves. Facets someone filled in by hand are their
      // reading of the record and are not a tier's business to overwrite.
      await saveRating(target, { ...(existing?.ratings ?? {}), overall: scoreForTier(tierId) }, existing?.review ?? '');
      show(`${target.title} → ${tierId}`);
      dismiss();
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not save that');
    }
  };

  return (
    <Sheet ref={ref} snapPoints={['62%']} contentHeight={430} onDismiss={onDismiss}>
      <ScrollView contentContainerClassName="gap-5 p-4 pb-8">
        {!target ? (
          <Text className="text-sm text-muted-foreground">Nothing selected.</Text>
        ) : (
          <>
            <View className="flex-row items-center gap-3">
              <View className="h-16 w-16 overflow-hidden rounded-md bg-secondary">
                {target.coverUrl ? (
                  <Image source={{ uri: target.coverUrl }} style={{ width: 64, height: 64 }} contentFit="cover" transition={120} />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Disc3 size={22} color={COLORS.mutedDeep} />
                  </View>
                )}
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={2} className="text-base font-bold text-foreground">
                  {target.title}
                </Text>
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
                  {[artistsToDisplayString(target.artist ?? []), releaseYear(target.releaseDate)].filter(Boolean).join(' • ')}
                </Text>
                {score != null && <Text className="text-xs font-semibold text-amber-400">{score.toFixed(1)} / 5</Text>}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Drop into</Text>
              <View className="flex-row gap-2">
                {TIERS.map((tier) => {
                  const active = current === tier.id;
                  return (
                    <Pressable
                      key={tier.id}
                      onPress={() => drop(tier.id)}
                      accessibilityLabel={`Rate ${target.title} tier ${tier.label}`}
                      className="flex-1 items-center justify-center rounded-xl border-2 py-4"
                      style={{
                        borderColor: active ? tier.color : 'transparent',
                        backgroundColor: active ? tier.color : tier.tint,
                      }}
                    >
                      <Text
                        className="text-xl font-black"
                        style={{ color: active ? 'rgba(0,0,0,0.8)' : tier.color }}
                      >
                        {tier.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="text-[11px] text-muted-foreground">
                A tier sets the overall score. Any facets you filled in by hand are left alone.
              </Text>
            </View>

            <View className="gap-2 border-t border-border pt-4">
              <Pressable
                onPress={() => {
                  dismiss();
                  router.push({ pathname: '/release/[albumKey]', params: { albumKey: target.albumKey } });
                }}
                className="flex-row items-center justify-center gap-2 rounded-full border border-border py-3 active:opacity-80"
              >
                <ExternalLink size={15} color={COLORS.foreground} />
                <Text className="font-medium text-foreground">Facets, review and the rest</Text>
              </Pressable>

              {!!existing && (
                <Pressable
                  onPress={async () => {
                    await removeRating(target.albumKey);
                    show('Rating removed');
                    dismiss();
                  }}
                  className="flex-row items-center justify-center gap-2 py-2 active:opacity-70"
                >
                  <Trash2 size={14} color={COLORS.danger} />
                  <Text className="text-sm text-red-400">Remove the rating</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Sheet>
  );
});
