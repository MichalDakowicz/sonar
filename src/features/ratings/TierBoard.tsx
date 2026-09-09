import { Pressable, ScrollView, Text, View } from 'react-native';

import { SubjectArtwork } from '@/features/ratings/SubjectArtwork';
import { personalScore } from '@/lib/personalScore';
import { groupByTier, type TierRow } from '@/lib/tiers';
import { artistsToDisplayString } from '@/lib/utils';
import type { AlbumRating } from '@/types/album';

const COVER = 84;

type TierBoardProps = {
  ratings: AlbumRating[];
  /** Tapping a cover opens the drop sheet for that release. */
  onPick: (rating: AlbumRating) => void;
  /** Tapping an empty row's hint starts the search, since the row needs filling. */
  onSearch?: () => void;
};

/**
 * The tier list: one row per band, everything you have rated sitting in the row
 * its score puts it in — releases, songs and artists alike, each drawn so you
 * can tell which is which (features/ratings/SubjectArtwork).
 *
 * A row is a horizontal scroller rather than a wrap, so a lopsided board (nine
 * albums in A, one in D) keeps every row the same height and the letters stay
 * readable as a column down the left edge.
 *
 * Tap to move, not drag. A drag across six rows of horizontal scrollers fights
 * both axes for every gesture, and the tap opens a sheet that can also hold the
 * full rating — which is the thing you actually came to change.
 */
export function TierBoard({ ratings, onPick, onSearch }: TierBoardProps) {
  const rows = groupByTier(ratings);

  return (
    <View className="gap-2 px-4">
      {rows.map((row) => (
        <Row key={row.tier.id} row={row} onPick={onPick} onSearch={onSearch} />
      ))}
    </View>
  );
}

function Row({ row, onPick, onSearch }: { row: TierRow; onPick: (rating: AlbumRating) => void; onSearch?: () => void }) {
  const { tier, ratings } = row;

  return (
    <View
      className="flex-row overflow-hidden rounded-2xl border border-border"
      style={{ backgroundColor: tier.tint, minHeight: COVER + 20 }}
    >
      <View className="w-12 items-center justify-center" style={{ backgroundColor: tier.color }}>
        <Text className="text-2xl font-black text-black/80">{tier.label}</Text>
        {ratings.length > 0 && <Text className="text-[10px] font-bold text-black/50">{ratings.length}</Text>}
      </View>

      {ratings.length === 0 ? (
        <Pressable onPress={onSearch} className="flex-1 justify-center px-4 active:opacity-70">
          <Text className="text-xs text-muted-foreground">
            {onSearch ? 'Nothing here yet — search for something to rate' : 'Nothing here yet'}
          </Text>
        </Pressable>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="items-center gap-2 p-2">
          {ratings.map((rating) => (
            <Cover key={rating.albumKey} rating={rating} onPress={() => onPick(rating)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Cover({ rating, onPress }: { rating: AlbumRating; onPress: () => void }) {
  const score = personalScore(rating.ratings);

  return (
    <Pressable onPress={onPress} className="active:opacity-70" style={{ width: COVER }}>
      <View style={{ width: COVER, height: COVER }}>
        <SubjectArtwork subject={rating.subject} uri={rating.coverUrl} size={COVER} />
        {score != null && (
          <View className="absolute bottom-0 left-0 rounded-tr bg-black/75 px-1">
            <Text className="text-[10px] font-bold text-amber-400">{score.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={1} className="pt-1 text-[10px] font-semibold text-foreground">
        {rating.title}
      </Text>
      <Text numberOfLines={1} className="text-[10px] text-muted-foreground">
        {artistsToDisplayString(rating.artist)}
      </Text>
    </Pressable>
  );
}
