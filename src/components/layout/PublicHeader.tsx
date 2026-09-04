import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Home, LogIn } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/features/friends/Avatar';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile } from '@/hooks/useProfile';

// Public-shelf top bar (ported from legacy PublicHeader.jsx) - shows whose
// shelf this is, plus a way back to your own app / to sign in. The bottom tab
// bar (u/[userId]/_layout) handles Library/Stats/Friends navigation.
export function PublicHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { profile } = useProfile(userId);

  const name = profile?.displayName || profile?.username || 'Public Shelf';

  return (
    <View
      className="flex-row items-center justify-between gap-3 border-b border-border bg-background/95 px-4 pb-3"
      style={{ paddingTop: insets.top + 10 }}
    >
      <View className="flex-1 flex-row items-center gap-3">
        <Avatar profile={profile} size={40} />
        <View className="flex-1">
          <Text numberOfLines={1} className="text-lg font-bold text-foreground">
            {name}
          </Text>
          {!!profile?.username && (
            <Text numberOfLines={1} className="text-xs text-muted-foreground">
              @{profile.username}
            </Text>
          )}
        </View>
      </View>

      {user ? (
        <Pressable
          onPress={() => router.replace('/' as Href)}
          className="flex-row items-center gap-2 rounded-full border border-border px-3 py-2 active:opacity-80"
        >
          <Home size={16} color="hsl(0 0% 98%)" />
          <Text className="text-sm font-medium text-foreground">My library</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push('/login')}
          className="flex-row items-center gap-2 rounded-full bg-foreground px-3 py-2 active:opacity-80"
        >
          <LogIn size={16} color="hsl(0 0% 9%)" />
          <Text className="text-sm font-semibold text-background">Sign in</Text>
        </Pressable>
      )}
    </View>
  );
}
