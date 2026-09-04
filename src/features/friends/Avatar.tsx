import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import type { Profile } from '@/types/album';

// Shared avatar (pfp image or initials fallback) used across friend cards,
// request items, search results, and the public-shelf header - single source so
// the fallback look is identical everywhere (legacy re-inlined it per file).
export function Avatar({ profile, size = 48 }: { profile: Pick<Profile, 'username' | 'displayName' | 'pfp'> | null; size?: number }) {
  const initials = (profile?.displayName || profile?.username || '?').slice(0, 2).toUpperCase();

  if (profile?.pfp) {
    return (
      <Image
        source={{ uri: profile.pfp }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-secondary"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text className="font-semibold text-muted-foreground" style={{ fontSize: size * 0.35 }}>
        {initials}
      </Text>
    </View>
  );
}
