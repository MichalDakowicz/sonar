import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatsView } from '@/features/stats/StatsView';
import { useAlbumRatings } from '@/hooks/useAlbumRatings';
import { useAlbums } from '@/hooks/useAlbums';
import { MAX_W } from '@/hooks/useResponsive';
import { useSpins } from '@/hooks/useSpins';
import { useStatsPeriod, useStatsPeriodSheet } from '@/store/statsPeriod';
import { withTabReload } from '@/store/tabReload';
import type { Album } from '@/types/album';

// Data fetching and navigation wiring live here; the composition is the shared
// StatsView, which a friend's public shelf renders too. All derivation is in
// features/stats/useStats over lib/stats.
export default withTabReload(StatsScreen, 'stats');

function StatsScreen() {
  const router = useRouter();
  const { albums, loading, error } = useAlbums();
  const { spins } = useSpins();
  const { albumRatings, ratingFor } = useAlbumRatings();
  const period = useStatsPeriod((s) => s.period);
  const presentPeriod = useStatsPeriodSheet((s) => s.present);

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenTop />
        <LoadingState label="Crunching your shelf…" />
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 bg-background">
        <ScreenTop />
        <ErrorState message={error instanceof Error ? error.message : 'Failed to load stats'} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenTop />
      <ContentShell fill maxWidth={MAX_W.detail}>
        <StatsView
          albums={albums}
          spins={spins}
          ratings={albumRatings}
          period={period}
          ratingsFor={(album: Album) => ratingFor(album.albumKey)?.ratings ?? null}
          onOpenAlbum={(album) => router.push({ pathname: '/album/[albumId]', params: { albumId: album.id } })}
          onOpenPeriod={() => presentPeriod?.()}
        />
      </ContentShell>
    </View>
  );
}
