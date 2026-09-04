import { Check, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Avatar } from '@/features/friends/Avatar';
import type { FriendRequest } from '@/hooks/useFriends';

type FriendRequestItemProps = {
  request: FriendRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  busy?: boolean;
};

export function FriendRequestItem({ request, onAccept, onReject, busy }: FriendRequestItemProps) {
  const { profile } = request;
  const name = profile.displayName || profile.username;

  return (
    <View className="flex-row items-center justify-between rounded-lg border border-border bg-card/60 p-3">
      <View className="flex-1 flex-row items-center gap-3">
        <Avatar profile={profile} size={40} />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-sm font-medium text-foreground">
            {name}
          </Text>
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            @{profile.username}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        {busy ? (
          <ActivityIndicator size="small" />
        ) : (
          <>
            <Pressable
              onPress={() => onAccept(profile.id)}
              className="rounded-md bg-primary/20 p-2 active:opacity-70"
            >
              <Check size={18} color="hsl(160 84% 39%)" />
            </Pressable>
            <Pressable onPress={() => onReject(profile.id)} className="rounded-md bg-secondary p-2 active:opacity-70">
              <X size={18} color="hsl(0 0% 63.9%)" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
