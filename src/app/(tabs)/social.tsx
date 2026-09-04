import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { ScreenTop } from '@/components/layout/ScreenTop';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { FeedView } from '@/features/social/FeedView';
import { FindView } from '@/features/social/FindView';
import { FriendsView } from '@/features/social/FriendsView';
import { useFeedWatermark } from '@/features/social/useFeedWatermark';
import { useFriendActivity } from '@/features/social/useFriendActivity';
import { useAlbumRatings } from '@/hooks/useAlbumRatings';
import { useAlbums } from '@/hooks/useAlbums';
import { useFriends } from '@/hooks/useFriends';
import { useProfile } from '@/hooks/useProfile';
import { MAX_W } from '@/hooks/useResponsive';
import { freshCountsSince } from '@/lib/socialFeed';
import { withTabReload } from '@/store/tabReload';
import type { Profile } from '@/types/album';

type Segment = 'activity' | 'friends' | 'find';

export default withTabReload(SocialScreen, 'social');

/**
 * Your friends' listening, your friend list, and people search behind one
 * segmented control. The requests inbox is the nav bar's action on this tab and
 * a friend's shelf is a pushed route, so each has a real back stack and its own
 * URL on web.
 */
function SocialScreen() {
  const { show } = useToast();
  const { user } = useAuth();
  const { profile: me } = useProfile(user?.id);
  const { friends, loading, error, sendRequest, removeFriend } = useFriends();
  const { albums } = useAlbums();
  const { ratings } = useAlbumRatings();
  const [segment, setSegment] = useState<Segment>('activity');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const since = useFeedWatermark();

  const authorIds = useMemo(
    () => [user?.id, ...friends.map((friend) => friend.id)].filter((id): id is string => !!id),
    [user?.id, friends],
  );
  const activity = useFriendActivity(authorIds, user?.id);

  // Covers for feed rows. An activity row only stores a title (it has to
  // survive the album being deleted), so artwork is looked up by release key
  // from what this device already has cached: your shelf and your ratings.
  const coverByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const rating of ratings) if (rating.coverUrl) map.set(rating.albumKey, rating.coverUrl);
    for (const album of albums) if (album.coverUrl) map.set(album.albumKey, album.coverUrl);
    return map;
  }, [albums, ratings]);

  const freshIds = useMemo(() => {
    const counts = freshCountsSince(activity.events, since);
    return new Set(Object.keys(counts).filter((id) => id !== user?.id));
  }, [activity.events, since, user?.id]);

  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.id)), [friends]);

  const handleSendRequest = async (profile: Profile) => {
    try {
      await sendRequest.mutateAsync(profile.id);
      setSentIds((previous) => new Set(previous).add(profile.id));
      show(`Friend request sent to ${profile.displayName || profile.username}`);
    } catch (requestError) {
      show(requestError instanceof Error ? requestError.message : 'Failed to send request');
    }
  };

  const handleRemove = async (id: string) => {
    const profile = friends.find((friend) => friend.id === id);
    const name = profile?.displayName || profile?.username || 'friend';
    try {
      await removeFriend.mutateAsync(id);
      show(`Removed ${name} — you can send a new request any time`);
    } catch (removeError) {
      show(removeError instanceof Error ? removeError.message : 'Failed to remove friend');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenTop />
        <LoadingState label="Loading social…" />
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 bg-background">
        <ScreenTop />
        <ErrorState message={error instanceof Error ? error.message : 'Failed to load your friends'} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenTop />

      <View className="px-4 pt-1">
        <ContentShell maxWidth={MAX_W.text}>
          <View className="flex-row gap-0.5 rounded-lg bg-secondary p-1">
            <SegBtn active={segment === 'activity'} onPress={() => setSegment('activity')} dot={freshIds.size > 0}>
              Activity
            </SegBtn>
            <SegBtn active={segment === 'friends'} onPress={() => setSegment('friends')}>
              Friends ({friends.length})
            </SegBtn>
            <SegBtn active={segment === 'find'} onPress={() => setSegment('find')}>
              Find
            </SegBtn>
          </View>
        </ContentShell>
      </View>

      <ContentShell fill maxWidth={MAX_W.text}>
        {segment === 'activity' && (
          <FeedView
            me={me}
            friends={friends}
            events={activity.events}
            loading={activity.loading}
            since={since}
            selfId={user?.id}
            coverFor={(albumKey) => (albumKey ? coverByKey.get(albumKey) ?? null : null)}
          />
        )}
        {segment === 'friends' && (
          <FriendsView
            friends={friends}
            freshIds={freshIds}
            removing={removeFriend.isPending}
            onRemove={handleRemove}
            onFind={() => setSegment('find')}
          />
        )}
        {segment === 'find' && <FindView friendIds={friendIds} sentIds={sentIds} onSendRequest={handleSendRequest} />}
      </ContentShell>
    </View>
  );
}

function SegBtn({
  active,
  onPress,
  dot,
  children,
}: {
  active: boolean;
  onPress: () => void;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className="min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-md"
      style={{ backgroundColor: active ? 'hsl(0 0% 27%)' : 'transparent' }}
    >
      <Text className={`text-[13.5px] font-medium ${active ? 'text-white' : 'text-muted-foreground'}`}>{children}</Text>
      {dot && <View className="h-1.5 w-1.5 rounded-full bg-primary" />}
    </Pressable>
  );
}
