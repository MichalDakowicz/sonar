import { Check, Search, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Avatar } from '@/features/friends/Avatar';
import { useDebounced } from '@/features/albums/add/useSpotifySearch';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { useUserSearch } from '@/hooks/useUserSearch';
import { COLORS } from '@/theme/colors';
import type { Profile } from '@/types/album';

type FindViewProps = {
  friendIds: Set<string>;
  sentIds: Set<string>;
  onSendRequest: (profile: Profile) => void;
};

/**
 * Username / display-name search over `public.profiles`, which is
 * world-readable. The same index Radar searches, because it is the same table —
 * so someone who signed up in either app is findable from both.
 */
export function FindView({ friendIds, sentIds, onSendRequest }: FindViewProps) {
  const [term, setTerm] = useState('');
  const debounced = useDebounced(term, 350);
  const { results, loading } = useUserSearch(debounced);
  const navBarSpace = useNavBarSpace();

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-3 px-4 pt-3"
      contentContainerStyle={{ paddingBottom: navBarSpace + 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="relative">
        <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
          <Search size={18} color={COLORS.muted} />
        </View>
        <SearchInput
          value={term}
          onChangeText={setTerm}
          placeholder="Search by username or name"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          autoCorrect={false}
          className="h-11 rounded-lg border border-border bg-secondary pl-10 pr-3 text-foreground"
        />
      </View>

      {loading && results.length === 0 && debounced.trim().length > 0 ? (
        <View className="items-center py-8">
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : debounced.trim().length === 0 ? (
        <EmptyState title="Find people" description="Search a username to send a friend request." />
      ) : results.length === 0 ? (
        <EmptyState title="Nobody found" description="Usernames are exact-ish — try fewer characters." />
      ) : (
        results.map((profile) => {
          const already = friendIds.has(profile.id);
          const sent = sentIds.has(profile.id);
          return (
            <View key={profile.id} className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
              <Avatar profile={profile} size={44} />
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                  {profile.displayName || profile.username}
                </Text>
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
                  @{profile.username}
                </Text>
              </View>
              <Pressable
                onPress={() => (already || sent ? undefined : onSendRequest(profile))}
                disabled={already || sent}
                accessibilityLabel={already ? 'Already friends' : sent ? 'Request sent' : `Add ${profile.username}`}
                className="min-h-[40px] flex-row items-center gap-1.5 rounded-full px-3"
                style={{ backgroundColor: already || sent ? 'rgba(255,255,255,0.06)' : COLORS.accentSoft }}
              >
                {already || sent ? <Check size={15} color={COLORS.muted} /> : <UserPlus size={15} color={COLORS.accent} />}
                <Text className={already || sent ? 'text-xs text-muted-foreground' : 'text-xs font-semibold text-primary'}>
                  {already ? 'Friends' : sent ? 'Sent' : 'Add'}
                </Text>
              </Pressable>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
