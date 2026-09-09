import { useLocalSearchParams } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatsView } from '@/features/stats/StatsView';
import { usePublicRatings } from '@/hooks/useAlbumRatings';
import { useCanViewUser, usePublicAlbums } from '@/hooks/usePublicAlbums';
import { MAX_W } from '@/hooks/useResponsive';
import { usePublicSpins } from '@/hooks/useSpins';
import { COLORS } from '@/theme/colors';

/**
 * A friend's numbers, through the same StatsView your own tab renders — so the
 * two can never disagree about what "most spun" means.
 *
 * Fixed at all-time: the period picker is a control of your app, and there is
 * no bar here to hang it off.
 */
export default function PublicStats() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { canView, loading: viewLoading } = useCanViewUser(userId);
  const { albums, loading } = usePublicAlbums(canView ? userId : undefined);
  const { spins } = usePublicSpins(canView ? userId : undefined);
  const { albumRatings, ratingFor } = usePublicRatings(canView ? userId : undefined);

  if (viewLoading || (canView && loading)) {
    return (
      <View className="flex-1 bg-background">
        <LoadingState label="Loading stats…" />
      </View>
    );
  }

  if (canView === false) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          icon={<Lock size={40} color={COLORS.mutedDeep} />}
          title="These stats are private"
          description="Only friends can see this collection."
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ContentShell fill maxWidth={MAX_W.detail}>
        <StatsView
          albums={albums}
          spins={spins}
          ratings={albumRatings}
          period="all"
          ratingsFor={(album) => ratingFor(album.albumKey)?.ratings ?? null}
        />
      </ContentShell>
    </View>
  );
}
