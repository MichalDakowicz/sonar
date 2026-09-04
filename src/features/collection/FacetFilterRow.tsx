import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { SearchInput } from '@/components/ui/SearchInput';
import { filterFacets, type Facet } from '@/lib/collectionFacets';
import { COLORS } from '@/theme/colors';

type FacetFilterRowProps = {
  title: string;
  facets: Facet[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Above this many options the row gets a search box instead of a wall of chips. */
  searchThreshold?: number;
  searchPlaceholder?: string;
};

const COLLAPSED_LIMIT = 18;

/**
 * One filter dimension derived from the collection (artist / genre / year /
 * format). Values come from the records the user actually has, so there are no
 * chips that match nothing. Long lists (artists, mainly) get a search box and
 * stay capped until the user asks for the rest.
 */
export function FacetFilterRow({
  title,
  facets,
  selected,
  onToggle,
  searchThreshold = 18,
  searchPlaceholder = 'Search…',
}: FacetFilterRowProps) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  if (facets.length === 0) return null;

  const searchable = facets.length > searchThreshold;
  const matching = searchable ? filterFacets(facets, query) : facets;
  // Selected values always render, even when the search or the cap would hide
  // them — a filter you cannot see is a filter you cannot switch off.
  const visible = expanded || query.trim() ? matching : matching.slice(0, COLLAPSED_LIMIT);
  const shown = [...visible, ...facets.filter((facet) => selected.includes(facet.value) && !visible.includes(facet))];
  const hiddenCount = matching.length - visible.length;

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        {selected.length > 0 && <Text className="text-xs text-muted-foreground">{selected.length} selected</Text>}
      </View>

      {searchable && (
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          placeholderTextColor={COLORS.muted}
          className="h-10 rounded-lg border border-border bg-secondary px-3 text-foreground"
        />
      )}

      <View className="flex-row flex-wrap gap-2">
        {shown.map((facet) => {
          const active = selected.includes(facet.value);
          return (
            <Pressable
              key={facet.value}
              onPress={() => onToggle(facet.value)}
              className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
              style={{
                borderColor: active ? COLORS.accent : 'transparent',
                backgroundColor: active ? COLORS.accentSoft : 'rgba(255,255,255,0.06)',
              }}
            >
              <Text className={active ? 'text-primary' : 'text-muted-foreground'}>{facet.value}</Text>
              <Text className="text-xs text-neutral-500">{facet.count}</Text>
            </Pressable>
          );
        })}

        {hiddenCount > 0 && (
          <Pressable
            onPress={() => setExpanded(true)}
            className="rounded-full px-3 py-1.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <Text className="text-muted-foreground">+{hiddenCount} more</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** A single-choice chip row (status, sort, grouping). */
export function ChoiceRow<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className="rounded-full border px-3 py-1.5"
              style={{
                borderColor: active ? COLORS.accent : 'transparent',
                backgroundColor: active ? COLORS.accentSoft : 'rgba(255,255,255,0.06)',
              }}
            >
              <Text className={active ? 'text-primary' : 'text-muted-foreground'}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
