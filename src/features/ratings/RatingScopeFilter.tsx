import { Pressable, Text, View } from 'react-native';

import type { AlbumRating, RatingSubject } from '@/types/album';
import { COLORS } from '@/theme/colors';

/** 'all' plus the three subjects. */
export type RatingScope = 'all' | RatingSubject;

const SCOPES: { id: RatingScope; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'album', label: 'Albums' },
  { id: 'song', label: 'Songs' },
  { id: 'artist', label: 'Artists' },
];

/** Ratings the scope keeps. Exported for the board and the curve to share. */
export function scopeRatings(ratings: AlbumRating[], scope: RatingScope): AlbumRating[] {
  return scope === 'all' ? ratings : ratings.filter((rating) => rating.subject === scope);
}

/**
 * What the board and the curve are counting.
 *
 * The board holds three kinds of opinion now, and "how you rate" is a
 * different shape for each — people are harder on albums than on the one song
 * they loved off them. A count per chip, so an empty scope is visibly empty
 * rather than looking like a broken board.
 */
export function RatingScopeFilter({
  ratings,
  scope,
  onChange,
}: {
  ratings: AlbumRating[];
  scope: RatingScope;
  onChange: (scope: RatingScope) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2 px-4">
      {SCOPES.map((option) => {
        const count = scopeRatings(ratings, option.id).length;
        const active = option.id === scope;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className="flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:opacity-80"
            style={{
              borderColor: active ? COLORS.accent : 'hsl(0 0% 20%)',
              backgroundColor: active ? COLORS.accentSoft : 'transparent',
            }}
          >
            <Text className={active ? 'text-xs font-bold text-primary' : 'text-xs font-semibold text-muted-foreground'}>
              {option.label}
            </Text>
            <Text className={active ? 'text-[11px] font-bold text-primary/70' : 'text-[11px] text-muted-foreground/60'}>
              {count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
