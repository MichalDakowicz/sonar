import { useLocalSearchParams } from 'expo-router';
import { Lock, Users } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { FriendCard } from '@/features/friends/FriendCard';
import { usePublicFriends } from '@/hooks/useFriends';
import { useCanViewUser } from '@/hooks/usePublicAlbums';
import { MAX_W } from '@/hooks/useResponsive';
import { COLORS } from '@/theme/colors';

/**
 * Who this person is friends with — the same list Radar would show, since
 * `public.friendships` is one table across both apps. Read-only: no remove
 * affordance on someone else's list.
 */
export default function PublicFriends() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { canView, loading: viewLoading } = useCanViewUser(userId);
  const { friends, loading } = usePublicFriends(canView ? userId : undefined);

  if (viewLoading || (canView && loading)) {
    return (
      <View className="flex-1 bg-background">
        <LoadingState label="Loading friends…" />
      </View>
    );
  }

  if (canView === false) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          icon={<Lock size={40} color={COLORS.mutedDeep} />}
          title="This list is private"
          description="Only friends can see who they listen alongside."
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ContentShell fill maxWidth={MAX_W.text}>
        {friends.length === 0 ? (
          <EmptyState icon={<Users size={40} color={COLORS.mutedDeep} />} title="No friends yet" />
        ) : (
          <ScrollView className="flex-1" contentContainerClassName="gap-2 px-4 py-4">
            {friends.map((friend) => (
              <FriendCard key={friend.id} profile={friend} />
            ))}
          </ScrollView>
        )}
      </ContentShell>
    </View>
  );
}
