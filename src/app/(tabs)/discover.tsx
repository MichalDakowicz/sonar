import { useRouter } from 'expo-router';
import { Disc3, Search } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { AlbumGrid } from '@/components/media/AlbumGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SearchInput } from '@/components/ui/SearchInput';
import { useToast } from '@/components/ui/Toast';
import { useQuickAdd } from '@/features/albums/add/useQuickAdd';
import { useNewReleases, useSpotifySearch } from '@/features/albums/add/useSpotifySearch';
import { useAlbumRatings } from '@/hooks/useAlbumRatings';
import { MAX_W, useIsDesktop } from '@/hooks/useResponsive';
import { useSearchFocusRegistration } from '@/hooks/useSearchFocusRegistration';
import { releaseToAlbum } from '@/lib/releasePreview';
import { COLORS } from '@/theme/colors';
import { withTabReload } from '@/store/tabReload';
import type { Album } from '@/types/album';

/**
 * Find music that is not on your shelf yet: Spotify search, and new releases as
 * the front page when the box is empty.
 *
 * Results are drawn as albums through the same card as everything else
 * (lib/releasePreview turns a Spotify hit into a card-shaped Album), so a
 * search result, a shelf record and a friend's copy all look and behave alike.
 * Search is the nav bar's action on this tab.
 */
export default withTabReload(DiscoverScreen, 'discover');

function DiscoverScreen() {
  const router = useRouter();
  const { show } = useToast();
  const isDesktop = useIsDesktop();
  const searchRef = useSearchFocusRegistration();
  const [term, setTerm] = useState('');
  const search = useSpotifySearch(term);
  const newReleases = useNewReleases();
  const { add, isAdded, pendingKey } = useQuickAdd();
  const { ratingFor } = useAlbumRatings();

  const searching = term.trim().length > 1;
  const releases = searching ? search.results : newReleases.releases;
  const loading = searching ? search.loading : newReleases.loading;
  const error = searching ? search.error : newReleases.error;
  const unconfigured = search.unconfigured;

  // Card-shaped previews. `id` is the release key, which is also what the
  // release route resolves — so tapping a preview and tapping the same record
  // on your shelf both land on the same screen.
  const previews = releases.map(releaseToAlbum);
  const ratingsFor = (album: Album) => ratingFor(album.albumKey)?.ratings ?? null;

  const openRelease = (album: Album) =>
    router.push({ pathname: '/release/[albumKey]', params: { albumKey: album.albumKey } });

  const handleAdd = async (album: Album) => {
    const release = releases.find((entry) => entry.albumKey === album.albumKey);
    if (!release) return;
    try {
      const added = await add(release);
      if (added) show(`${added.title} added to your collection`);
    } catch (addError) {
      show(addError instanceof Error ? addError.message : 'Could not add that album');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenTop />

      <ContentShell maxWidth={MAX_W.grid}>
        <View className={isDesktop ? 'px-8 pb-4 pt-4' : 'px-4 pb-3 pt-2'}>
          <View className="relative">
            <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
              <Search size={18} color={COLORS.muted} />
            </View>
            <SearchInput
              ref={searchRef}
              value={term}
              onChangeText={setTerm}
              placeholder={isDesktop ? 'Search Spotify…    /' : 'Search Spotify…'}
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              autoCorrect={false}
              className="h-10 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-foreground"
              style={isDesktop ? { maxWidth: 480 } : undefined}
            />
          </View>
        </View>
      </ContentShell>

      <ContentShell fill maxWidth={MAX_W.grid}>
        {unconfigured ? (
          <EmptyState
            icon={<Disc3 size={40} color={COLORS.mutedDeep} />}
            title="Spotify search is off"
            description="Add EXPO_PUBLIC_SPOTIFY_CLIENT_ID and _SECRET to .env, then restart the app. You can still add albums by hand from the collection tab."
          />
        ) : loading && previews.length === 0 ? (
          <LoadingState label={searching ? 'Searching Spotify…' : 'Loading new releases…'} />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Spotify request failed'}
            onRetry={searching ? undefined : () => newReleases.refetch()}
          />
        ) : (
          <AlbumGrid
            albums={previews}
            variant="cover"
            size="normal"
            ratingsFor={ratingsFor}
            onPress={openRelease}
            onAdd={handleAdd}
            isAdded={(album) => isAdded(album.albumKey)}
            highlightedId={pendingKey}
            ListEmptyComponent={
              <EmptyState
                icon={<Disc3 size={40} color={COLORS.mutedDeep} />}
                title={searching ? 'No albums found' : 'Nothing to show'}
                description={searching ? 'Check the spelling, or paste a Spotify link.' : 'Try a search instead.'}
              />
            }
          />
        )}
      </ContentShell>
    </View>
  );
}
