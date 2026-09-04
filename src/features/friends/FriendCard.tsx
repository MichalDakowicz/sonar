import { useRouter } from 'expo-router';
import { ExternalLink, UserMinus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/features/friends/Avatar';
import type { Profile } from '@/types/album';

type FriendCardProps = {
  profile: Profile;
  onRemove?: (id: string) => void;
};

// One friend row - avatar, name/@username, open-shelf + optional remove. Public
// friend lists pass no onRemove (read-only).
export function FriendCard({ profile, onRemove }: FriendCardProps) {
  const router = useRouter();
  const name = profile.displayName || profile.username;

  return (
    <View className="flex-row items-center justify-between rounded-xl border border-border bg-card p-3">
      <Pressable
        className="flex-1 flex-row items-center gap-3"
        onPress={() => router.push({ pathname: '/u/[userId]', params: { userId: profile.id } })}
      >
        <Avatar profile={profile} size={48} />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-base font-bold text-foreground">
            {name}
          </Text>
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            @{profile.username}
          </Text>
        </View>
      </Pressable>

      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={() => router.push({ pathname: '/u/[userId]', params: { userId: profile.id } })}
          className="rounded-lg p-2 active:bg-secondary"
        >
          <ExternalLink size={20} color="hsl(160 84% 39%)" />
        </Pressable>
        {onRemove && (
          <Pressable onPress={() => onRemove(profile.id)} className="rounded-lg p-2 active:bg-secondary">
            <UserMinus size={20} color="hsl(0 0% 63.9%)" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
