import { Sparkles, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { useToast } from '@/components/ui/Toast';
import { RatingSlider, RatingSliderPrecise, RatingValue } from '@/features/ratings/RatingSlider';
import { useAlbumRatings, type RateTarget } from '@/hooks/useAlbumRatings';
import { facetsFor, recalcOverall, toFacetValues, toRatingsPayload, type FacetValues } from '@/lib/ratings';
import { COLORS } from '@/theme/colors';

type RatingEditorProps = {
  /** What is being rated — owning it is not required. */
  target: RateTarget;
  /** Rendered above the facets, e.g. a note that this is not on your shelf. */
  note?: string;
};

/**
 * Rate anything — a release owned or not, one song, or an artist.
 *
 * This is the piece Sonar did not have before: because ratings live in their
 * own table keyed by subject (see hooks/useAlbumRatings), the same editor works
 * on a record on your shelf, a friend's copy, a search result you have only
 * ever streamed, a single track, and a whole discography. Nothing here asks
 * whether you own it, and for two of the three subjects you cannot.
 *
 * Four facets at half-star steps, plus an overall score that can be dragged to
 * a tenth or auto-filled from the facets — the same shape Radar rates films in.
 */
export function RatingEditor({ target, note }: RatingEditorProps) {
  const { ratingFor, saveRating, removeRating } = useAlbumRatings();
  const { show } = useToast();
  const existing = ratingFor(target.albumKey);
  // Same four keys for every subject, different questions — a song's take and
  // an artist's whole catalogue are not asked about the same way (lib/ratings).
  const facetList = facetsFor(target.subject ?? 'album');

  // A draft, not a copy: null means "nothing edited yet", so what is on screen
  // is whatever the stored rating says — including when it arrives after first
  // render, or when a realtime echo of your own save lands. There is no
  // seeding effect to race, and an edit in progress cannot be overwritten.
  const [draft, setDraft] = useState<{ facets: FacetValues; overall: number; review: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const facets = draft?.facets ?? toFacetValues(existing?.ratings);
  const overall = draft?.overall ?? existing?.ratings.overall ?? 0;
  const review = draft?.review ?? existing?.review ?? '';
  const dirty = draft !== null;

  const edit = (patch: Partial<{ facets: FacetValues; overall: number; review: string }>) =>
    setDraft({ facets, overall, review, ...patch });

  const setFacet = (key: keyof FacetValues, value: number) => edit({ facets: { ...facets, [key]: value } });

  const autoFill = () => {
    const average = recalcOverall(facets);
    if (average == null) return show('Rate a category first');
    edit({ overall: average });
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveRating(target, toRatingsPayload(facets, overall), review);
      setDraft(null);
      show('Rating saved');
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not save the rating');
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    try {
      await removeRating(target.albumKey);
      setDraft(null);
      show('Rating removed');
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not remove the rating');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your rating</Text>
        {!!existing && (
          <Pressable onPress={clear} hitSlop={8} className="flex-row items-center gap-1.5 active:opacity-70">
            <Trash2 size={13} color={COLORS.danger} />
            <Text className="text-xs text-red-400">Remove</Text>
          </Pressable>
        )}
      </View>

      {!!note && <Text className="text-xs text-muted-foreground">{note}</Text>}

      <View className="gap-3 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Overall</Text>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={autoFill} hitSlop={8} className="flex-row items-center gap-1 active:opacity-70">
              <Sparkles size={13} color={COLORS.accent} />
              <Text className="text-xs text-primary">Average</Text>
            </Pressable>
            <RatingValue value={overall} />
          </View>
        </View>
        <RatingSliderPrecise value={overall} onChange={(value) => edit({ overall: value })} />
      </View>

      <View className="gap-4">
        {facetList.map((facet) => (
          <View key={facet.key} className="gap-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold uppercase text-muted-foreground">{facet.label}</Text>
                <Text className="text-[11px] text-muted-foreground/70">{facet.hint}</Text>
              </View>
              <RatingValue value={facets[facet.key as keyof FacetValues]} />
            </View>
            <RatingSlider
              value={facets[facet.key as keyof FacetValues]}
              onChange={(value) => setFacet(facet.key as keyof FacetValues, value)}
            />
          </View>
        ))}
      </View>

      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Review</Text>
        <TextInput
          value={review}
          onChangeText={(value) => edit({ review: value })}
          multiline
          placeholder="What did you make of it?"
          placeholderTextColor={COLORS.muted}
          className="min-h-24 rounded-xl border border-border bg-secondary px-4 py-3 text-sm leading-relaxed text-foreground"
        />
      </View>

      <Pressable
        onPress={save}
        disabled={saving || !dirty}
        className="flex-row items-center justify-center gap-2 rounded-full bg-primary py-3 active:opacity-80"
        style={{ opacity: saving || !dirty ? 0.5 : 1 }}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="font-semibold text-primary-foreground">{existing ? 'Update rating' : 'Save rating'}</Text>
        )}
      </Pressable>
    </View>
  );
}
