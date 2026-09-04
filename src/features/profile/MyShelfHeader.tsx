import { LinearGradient } from 'expo-linear-gradient';
import { Pencil, Share2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverImage } from '@/components/media/CoverImage';
import { Avatar } from '@/features/friends/Avatar';
import type { ShelfStats } from '@/lib/shelfSummary';
import { COLORS } from '@/theme/colors';
import type { Profile } from '@/types/album';

type MyShelfHeaderProps = {
  profile: Profile | null;
  email?: string | null;
  stats: ShelfStats;
  /** Artwork behind the header — the last record you played. */
  backdropUrl: string | null;
  onEdit?: () => void;
  onShare?: () => void;
};

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-xl font-bold text-foreground">{value}</Text>
      <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Text>
    </View>
  );
}

/**
 * The top of your own shelf, built from the same pieces a friend's shelf header
 * is, so the two cannot drift: what you see here is what they see there, plus
 * the owner-only edit and share affordances.
 *
 * The profile itself (avatar, name, username) is the row Radar shows too — one
 * identity across both apps.
 */
export function MyShelfHeader({ profile, email, stats, backdropUrl, onEdit, onShare }: MyShelfHeaderProps) {
  const insets = useSafeAreaInsets();
  const name = profile?.displayName || profile?.username || 'Your shelf';

  return (
    <View className="relative">
      <View className="absolute inset-0 overflow-hidden">
        <CoverImage uri={backdropUrl} iconSize={0} />
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'rgba(9,9,11,0.9)', 'rgb(9,9,11)']}
          locations={[0, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={{ paddingTop: insets.top + 16 }} className="gap-5 px-4 pb-5">
        <View className="flex-row items-center gap-4">
          <Avatar profile={profile} size={68} />
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-2xl font-bold text-foreground">
              {name}
            </Text>
            {!!profile?.username && (
              <Text numberOfLines={1} className="text-sm text-muted-foreground">
                @{profile.username}
              </Text>
            )}
            {!!email && (
              <Text numberOfLines={1} className="text-[11px] text-muted-foreground/70">
                {email}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row items-center justify-around rounded-2xl border border-border bg-card/60 py-4">
          <Stat value={stats.albums} label="Records" />
          <Stat value={stats.thisYear} label="This year" />
          <Stat value={stats.average != null ? stats.average.toFixed(1) : '—'} label="Avg rating" />
        </View>

        <View className="flex-row gap-2">
          {!!onEdit && (
            <Pressable
              onPress={onEdit}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border py-2.5 active:opacity-80"
            >
              <Pencil size={15} color={COLORS.foreground} />
              <Text className="text-sm font-medium text-foreground">Edit profile</Text>
            </Pressable>
          )}
          {!!onShare && (
            <Pressable
              onPress={onShare}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-border py-2.5 active:opacity-80"
            >
              <Share2 size={15} color={COLORS.foreground} />
              <Text className="text-sm font-medium text-foreground">Share shelf</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
