import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Avatar } from '@/features/friends/Avatar';
import { FeedCard } from '@/features/social/FeedCard';
import { useCommentCounts } from '@/features/social/useActivityComments';
import { useActivityReactions } from '@/features/social/useActivityReactions';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { useProfileMap } from '@/hooks/useProfile';
import { feedKind, FEED_FILTERS, freshCountsSince, matchesFeedFilter, type FeedFilter } from '@/lib/socialFeed';
import { COLORS } from '@/theme/colors';
import type { AlbumActivityEvent, Profile } from '@/types/album';

type FeedViewProps = {
  me: Profile | null;
  friends: Profile[];
  events: AlbumActivityEvent[];
  loading: boolean;
  /** Watermark of your last visit — what "new" is counted against. */
  since: string | null;
  /** Cover lookup by album key, from your own library and your friends'. */
  coverFor: (albumKey: string | null) => string | null;
  selfId: string | undefined;
};

/**
 * Your friends' listening, newest first, with two ways to narrow it: the rail
 * picks one person, the chips pick one kind of event. Both are local state —
 * they are a way of reading the feed, not a preference worth persisting.
 */
export function FeedView({ me, friends, events, loading, since, coverFor, selfId }: FeedViewProps) {
  const router = useRouter();
  const navBarSpace = useNavBarSpace();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [onlyId, setOnlyId] = useState<string | null>(null);

  const freshCounts = useMemo(() => freshCountsSince(events, since), [events, since]);

  const visible = useMemo(() => {
    let result = events;
    // Nobody picked: the feed is about them, so your own rows stay out until you
    // tap yourself in the rail.
    result = onlyId ? result.filter((event) => event.userId === onlyId) : result.filter((event) => event.userId !== selfId);
    if (filter !== 'all') result = result.filter((event) => matchesFeedFilter(feedKind(event), filter));
    return result;
  }, [events, onlyId, selfId, filter]);

  const authors = useProfileMap(useMemo(() => events.map((event) => event.userId), [events]));
  const visibleIds = useMemo(() => visible.map((event) => event.id), [visible]);
  const reactions = useActivityReactions(visibleIds);
  const commentCountFor = useCommentCounts(visibleIds);

  const railPeople: (Profile | null)[] = [me, ...friends];

  if (loading && events.length === 0) return <LoadingState label="Loading the feed…" />;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-3 pt-3"
      contentContainerStyle={{ paddingBottom: navBarSpace + 16 }}
      showsVerticalScrollIndicator={false}
    >
      {friends.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4 px-4">
          {railPeople.filter((person): person is Profile => !!person).map((person) => {
            const active = onlyId === person.id;
            const fresh = freshCounts[person.id] ?? 0;
            const isMe = person.id === selfId;
            return (
              <Pressable
                key={person.id}
                onPress={() => setOnlyId(active ? null : person.id)}
                className="w-16 items-center gap-1.5 active:opacity-70"
              >
                <View
                  className="rounded-full p-0.5"
                  style={{ borderWidth: 2, borderColor: active ? COLORS.accent : fresh > 0 ? COLORS.star : 'transparent' }}
                >
                  <Avatar profile={person} size={48} />
                </View>
                <Text numberOfLines={1} className={active ? 'text-[11px] font-bold text-primary' : 'text-[11px] text-muted-foreground'}>
                  {isMe ? 'You' : person.displayName || person.username}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4">
        {FEED_FILTERS.map((chip) => {
          const active = filter === chip.key;
          return (
            <Pressable
              key={chip.key}
              onPress={() => setFilter(chip.key)}
              className="min-h-[34px] justify-center rounded-full border px-3"
              style={{
                borderColor: active ? COLORS.accent : 'transparent',
                backgroundColor: active ? COLORS.accentSoft : 'rgba(255,255,255,0.06)',
              }}
            >
              <Text className={active ? 'text-xs font-bold text-primary' : 'text-xs text-muted-foreground'}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="gap-3 px-4">
        {visible.length === 0 ? (
          <EmptyState
            icon={<Users size={36} color={COLORS.mutedDeep} />}
            title={friends.length === 0 ? 'No friends yet' : 'Nothing here'}
            description={
              friends.length === 0
                ? 'Find people on the Find tab — you already share your account with Radar, so your friends there are your friends here.'
                : 'No activity matches this filter yet.'
            }
          />
        ) : (
          visible.map((event) => (
            <FeedCard
              key={event.id}
              event={event}
              author={authors.get(event.userId)}
              coverUrl={coverFor(event.albumKey)}
              fresh={!!since && Date.parse(event.createdAt) > Date.parse(since)}
              reactions={reactions.reactionsFor(event.id)}
              commentCount={commentCountFor(event.id)}
              onToggleReaction={(kind) => reactions.toggleReaction(event.id, kind)}
              onOpenThread={() => router.push({ pathname: '/activity/[activityId]', params: { activityId: event.id } })}
              onOpenAlbum={() =>
                event.albumKey
                  ? router.push({ pathname: '/release/[albumKey]', params: { albumKey: event.albumKey } })
                  : undefined
              }
              onOpenProfile={() => router.push({ pathname: '/u/[userId]', params: { userId: event.userId } })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
