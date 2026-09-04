import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { RatingCurve } from '@/components/stats/RatingCurve';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import type { BottomSheetModal } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { EditProfileSheet } from '@/features/profile/EditProfileSheet';
import { MyShelfHeader } from '@/features/profile/MyShelfHeader';
import { RandomSpinSheet } from '@/features/profile/RandomSpinSheet';
import { ShelfSections } from '@/features/profile/ShelfSections';
import { SpinPromptCard } from '@/features/profile/SpinPromptCard';
import { useAlbumRatings } from '@/hooks/useAlbumRatings';
import { useAlbums } from '@/hooks/useAlbums';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { useProfile } from '@/hooks/useProfile';
import { MAX_W } from '@/hooks/useResponsive';
import { useSpins } from '@/hooks/useSpins';
import { isOwned } from '@/lib/albumStatus';
import { ratingDistribution } from '@/lib/ratingDistribution';
import { publicShelfUrl } from '@/lib/shelfLink';
import { nowPlaying, recentlyAdded, shelfStats, topRated } from '@/lib/shelfSummary';
import { COLORS } from '@/theme/colors';
import { withTabReload } from '@/store/tabReload';
import type { Album } from '@/types/album';

/** Nothing logged in this long counts as neglected by the picker. */
const NEGLECTED_DAYS = 60;

/**
 * Your own shelf, built from the same pieces a friend's shelf is
 * (features/profile/ShelfSections) so the two never drift: what you see here is
 * what they see there, plus the owner-only affordances. Settings is the nav
 * bar's action on this tab.
 */
export default withTabReload(ProfileScreen, 'profile');

function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const { profile } = useProfile(user?.id);
  const { albums, loading, error } = useAlbums();
  const { spins, logSpin } = useSpins();
  const { ratings, ratingFor } = useAlbumRatings();
  const navBarSpace = useNavBarSpace();

  const editProfileRef = useRef<BottomSheetModal>(null);
  const spinRef = useRef<BottomSheetModal>(null);
  // Bumped rather than set: pressing the same scope twice has to re-open the
  // sheet, and the counter is what makes the second press a new value.
  const [pickRequest, setPickRequest] = useState<{ scope: 'collection' | 'neglected'; nonce: number } | null>(null);

  const stats = useMemo(() => shelfStats(albums, ratings), [albums, ratings]);
  const recent = useMemo(() => recentlyAdded(albums), [albums]);
  const playing = useMemo(() => nowPlaying(albums, spins), [albums, spins]);
  const best = useMemo(() => topRated(albums, ratings), [albums, ratings]);
  const distribution = useMemo(() => ratingDistribution(ratings), [ratings]);

  // Read once, on mount, rather than on every render: "neglected" is a cutoff,
  // and a clock read during render would make the list impure and re-derive it
  // every pass for no benefit. The screen is remounted on tab reload anyway.
  const [mountedAt] = useState(() => Date.now());

  const owned = useMemo(() => albums.filter(isOwned), [albums]);
  const neglected = useMemo(() => {
    const cutoff = mountedAt - NEGLECTED_DAYS * 86_400_000;
    return owned.filter((album) => !album.lastListenedAt || Date.parse(album.lastListenedAt) < cutoff);
  }, [owned, mountedAt]);
  const pickPool = pickRequest?.scope === 'neglected' ? neglected : owned;

  // Presented from an effect, not from the press handler: the sheet starts its
  // reel the moment it opens, so the new pool has to be committed as a prop
  // first or the draw is made from whichever scope was picked last.
  useEffect(() => {
    if (pickRequest) spinRef.current?.present();
  }, [pickRequest]);

  const openAlbum = (album: Album) => router.push({ pathname: '/album/[albumId]', params: { albumId: album.id } });
  const ratingsFor = (album: Album) => ratingFor(album.albumKey)?.ratings ?? null;

  const handleLogSpin = async (album: Album) => {
    await logSpin(album);
    show(`Spin logged for ${album.title}`);
  };

  const share = async () => {
    if (!user) return;
    await Clipboard.setStringAsync(publicShelfUrl(user.id));
    show('Public shelf link copied');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenTop />
        <LoadingState label="Loading your shelf…" />
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 bg-background">
        <ScreenTop />
        <ErrorState message={error instanceof Error ? error.message : 'Failed to load your shelf'} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ContentShell fill maxWidth={MAX_W.text}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: navBarSpace }}>
          <MyShelfHeader
            profile={profile}
            email={user?.email}
            stats={stats}
            backdropUrl={playing[0]?.coverUrl ?? recent[0]?.coverUrl ?? null}
            onEdit={() => editProfileRef.current?.present()}
            onShare={share}
          />

          <ShelfSections
            topRated={best}
            nowPlaying={playing}
            recent={recent}
            ratingsFor={ratingsFor}
            onOpenAlbum={openAlbum}
            onLogSpin={handleLogSpin}
            belowTopRated={
              <View className="gap-6">
                <SpinPromptCard
                  collectionCount={owned.length}
                  neglectedCount={neglected.length}
                  onPick={(scope) => setPickRequest((previous) => ({ scope, nonce: (previous?.nonce ?? 0) + 1 }))}
                />
                {/* Under the picker: the picker is a prompt about tonight, the
                    curve is a read on everything you have ever scored. */}
                <View className="mx-4 rounded-2xl border border-border bg-card/50 p-5">
                  <RatingCurve distribution={distribution} />
                </View>
              </View>
            }
            belowNowPlaying={
              <Pressable
                onPress={() => router.push('/history')}
                className="mx-4 flex-row items-center gap-3 rounded-2xl border border-border bg-card/50 p-4 active:opacity-80"
              >
                <Clock size={18} color={COLORS.accent} />
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-foreground">Listening history</Text>
                  <Text className="text-xs text-muted-foreground">
                    {spins.length === 0 ? 'Nothing logged yet' : `${spins.length} spins logged`}
                  </Text>
                </View>
              </Pressable>
            }
          />
        </ScrollView>
      </ContentShell>

      {/* Both sheets are mounted here rather than inside the scrolling body: a
          sheet declared in that subtree cannot scroll its own content, because
          the surrounding ScrollView wins the pan gesture. */}
      <EditProfileSheet ref={editProfileRef} />
      <RandomSpinSheet
        ref={spinRef}
        albums={pickPool}
        ratingsFor={ratingsFor}
        onSelect={(album) => {
          spinRef.current?.dismiss();
          openAlbum(album);
        }}
        onLogSpin={async (album) => {
          await handleLogSpin(album);
          spinRef.current?.dismiss();
        }}
      />
    </View>
  );
}
