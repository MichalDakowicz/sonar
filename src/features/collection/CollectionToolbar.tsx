import { ArrowDown, ArrowUp, LayoutGrid, Layers, List, Search, SlidersHorizontal } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { SearchInput } from '@/components/ui/SearchInput';
import { useIsDesktop } from '@/hooks/useResponsive';
import { useSearchFocusRegistration } from '@/hooks/useSearchFocusRegistration';
import { activeFilterCount, useCollectionPrefs } from '@/store/collectionPrefs';
import { COLORS } from '@/theme/colors';

type CollectionToolbarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFilters: () => void;
  onOpenGrouping: () => void;
};

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return (
    <View className="h-10 flex-row items-center gap-0.5 rounded-lg border border-border bg-secondary p-1">{children}</View>
  );
}

/**
 * One row: search on the left, then the filter / group / sort-direction /
 * view-mode pill groups. Icon-only buttons so the whole row fits a phone width,
 * which is what the legacy web toolbar could not do without wrapping.
 */
export function CollectionToolbar({ searchQuery, onSearchChange, onOpenFilters, onOpenGrouping }: CollectionToolbarProps) {
  const prefs = useCollectionPrefs();
  const isDesktop = useIsDesktop();
  const searchRef = useSearchFocusRegistration();
  const filterCount = activeFilterCount(prefs);
  const grouped = prefs.groupBy !== 'none';
  const SortArrow = prefs.sortDir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <View className={isDesktop ? 'flex-row items-center gap-2 px-8 pb-4 pt-4' : 'flex-row items-center gap-2 px-4 pb-3 pt-2'}>
      <View className="relative min-w-0 flex-1" style={isDesktop ? { maxWidth: 420 } : undefined}>
        <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
          <Search size={18} color={COLORS.muted} />
        </View>
        <SearchInput
          ref={searchRef}
          value={searchQuery}
          onChangeText={onSearchChange}
          // The hint is the discoverability for the global "/" shortcut.
          placeholder={isDesktop ? 'Search collection…    /' : 'Search collection…'}
          placeholderTextColor={COLORS.muted}
          className="h-10 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-foreground"
        />
      </View>

      {/* Search is capped on desktop, so the control groups need a spacer to
          stay pinned to the right edge of the content column. */}
      {isDesktop && <View className="flex-1" />}

      <View className="shrink-0 flex-row items-center gap-2">
        <ToolbarGroup>
          <Pressable
            onPress={onOpenFilters}
            accessibilityLabel="Filter and sort"
            className="flex-row items-center gap-1.5 rounded px-2 py-1"
          >
            <SlidersHorizontal size={16} color={filterCount > 0 ? COLORS.accent : COLORS.muted} />
            {filterCount > 0 && (
              <View className="h-4 w-4 items-center justify-center rounded-full bg-primary">
                <Text className="text-[10px] font-bold text-primary-foreground">{filterCount}</Text>
              </View>
            )}
          </Pressable>
        </ToolbarGroup>

        <ToolbarGroup>
          <Pressable onPress={onOpenGrouping} accessibilityLabel="Group by" className="rounded px-2 py-1">
            <Layers size={16} color={grouped ? COLORS.accent : COLORS.muted} />
          </Pressable>
        </ToolbarGroup>

        <ToolbarGroup>
          <Pressable
            onPress={prefs.toggleSortDir}
            accessibilityLabel={prefs.sortDir === 'asc' ? 'Sort ascending' : 'Sort descending'}
            className="rounded p-1.5"
          >
            <SortArrow size={18} color={COLORS.muted} />
          </Pressable>
        </ToolbarGroup>

        <ToolbarGroup>
          <Pressable
            onPress={() => prefs.setViewMode('grid')}
            accessibilityLabel="Grid view"
            className="rounded p-1.5"
            style={{ backgroundColor: prefs.viewMode === 'grid' ? 'hsl(0 0% 20%)' : 'transparent' }}
          >
            <LayoutGrid size={18} color={prefs.viewMode === 'grid' ? COLORS.foreground : COLORS.muted} />
          </Pressable>
          <Pressable
            onPress={() => prefs.setViewMode('list')}
            accessibilityLabel="List view"
            className="rounded p-1.5"
            style={{ backgroundColor: prefs.viewMode === 'list' ? 'hsl(0 0% 20%)' : 'transparent' }}
          >
            <List size={18} color={prefs.viewMode === 'list' ? COLORS.foreground : COLORS.muted} />
          </Pressable>
        </ToolbarGroup>
      </View>
    </View>
  );
}
