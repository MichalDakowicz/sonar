import { UserPlus, Users } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { FriendCard } from '@/features/friends/FriendCard';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { COLORS } from '@/theme/colors';
import type { Profile } from '@/types/album';

type FriendsViewProps = {
  friends: Profile[];
  /** Friends with activity newer than your last visit. */
  freshIds: Set<string>;
  removing: boolean;
  onRemove: (id: string) => void;
  onFind: () => void;
};

/**
 * Your friend list. The same rows a friend request turns into, and the same
 * people you see in Radar — `public.friendships` is one table across both apps,
 * so adding someone here adds them there.
 */
export function FriendsView({ friends, freshIds, onRemove, onFind }: FriendsViewProps) {
  const navBarSpace = useNavBarSpace();

  if (friends.length === 0) {
    return (
      <EmptyState
        icon={<Users size={40} color={COLORS.mutedDeep} />}
        title="No friends yet"
        description="Your friends are shared with Radar — if you have any there, they are already here."
        action={
          <Pressable
            onPress={onFind}
            className="mt-2 flex-row items-center gap-2 rounded-full bg-primary px-5 py-3 active:opacity-80"
          >
            <UserPlus size={16} color="#fff" />
            <Text className="font-semibold text-primary-foreground">Find people</Text>
          </Pressable>
        }
      />
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-2 px-4 pt-3"
      contentContainerStyle={{ paddingBottom: navBarSpace + 16 }}
      showsVerticalScrollIndicator={false}
    >
      {friends.map((friend) => (
        <View key={friend.id} className="relative">
          <FriendCard profile={friend} onRemove={onRemove} />
          {freshIds.has(friend.id) && (
            <View className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </View>
      ))}
    </ScrollView>
  );
}
