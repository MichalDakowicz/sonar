import { Inbox as InboxIcon } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { NavIslands } from '@/components/layout/NavIslands';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { FriendRequestItem } from '@/features/friends/FriendRequestItem';
import { NestedHeader } from '@/features/social/NestedHeader';
import { useFriends } from '@/hooks/useFriends';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { MAX_W } from '@/hooks/useResponsive';
import { COLORS } from '@/theme/colors';

/**
 * Friend requests waiting on you — the nav bar's action on the Social tab.
 *
 * Accepting writes both sides of the friendship, which owner-only RLS cannot
 * express, so it goes through Radar's `accept_friend_request` security-definer
 * RPC. Same table, same function, both apps.
 */
export default function Inbox() {
  const { requests, loading, acceptRequest, rejectRequest } = useFriends();
  const { show } = useToast();
  const navBarSpace = useNavBarSpace();

  const accept = async (id: string) => {
    const name = requests.find((request) => request.profile.id === id)?.profile.username ?? 'friend';
    try {
      await acceptRequest.mutateAsync(id);
      show(`You and @${name} are now friends`);
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not accept that request');
    }
  };

  const reject = async (id: string) => {
    try {
      await rejectRequest.mutateAsync(id);
      show('Request declined');
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not decline that request');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <NestedHeader title="Friend requests" />

      <ContentShell fill maxWidth={MAX_W.text}>
        {loading ? (
          <LoadingState label="Loading requests…" />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<InboxIcon size={40} color={COLORS.mutedDeep} />}
            title="Nothing waiting"
            description="Friend requests from either app land here."
          />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-2 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: navBarSpace + 16 }}
          >
            <Text className="pb-1 text-xs text-muted-foreground">
              Accepting adds them in Radar too — it is one friend list across both apps.
            </Text>
            {requests.map((request) => (
              <FriendRequestItem
                key={request.profile.id}
                request={request}
                onAccept={accept}
                onReject={reject}
                busy={acceptRequest.isPending || rejectRequest.isPending}
              />
            ))}
          </ScrollView>
        )}
      </ContentShell>

      {/* Pushed out of the tabs, so the navigator's own bar is gone — the screen
          mounts it itself and Social stays lit while you are down here. */}
      <NavIslands />
    </View>
  );
}
