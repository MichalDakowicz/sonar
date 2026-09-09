import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { NavIslands } from '@/components/layout/NavIslands';
import { CoverImage } from '@/components/media/CoverImage';
import { LoadingState } from '@/components/ui/LoadingState';
import { SearchInput } from '@/components/ui/SearchInput';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { Avatar } from '@/features/friends/Avatar';
import { NestedHeader } from '@/features/social/NestedHeader';
import { useActivityComments, COMMENT_MAX } from '@/features/social/useActivityComments';
import { useActivityDetail } from '@/features/social/useActivityDetail';
import { useActivityReactions } from '@/features/social/useActivityReactions';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { useProfile, useProfileMap } from '@/hooks/useProfile';
import { MAX_W } from '@/hooks/useResponsive';
import { ratingHref } from '@/lib/ratingHref';
import { activityVerb, relativeTime, REACTIONS } from '@/lib/socialFeed';
import { COLORS } from '@/theme/colors';

/**
 * One feed row, with its thread. Pushed from a card in the feed rather than
 * expanded in place: a comment box inside a virtualized list fights the list
 * for the keyboard, and a thread deserves its own back stack and URL.
 */
export default function ActivityDetail() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const navBarSpace = useNavBarSpace();
  const { event, coverUrl, loading } = useActivityDetail(activityId);
  const { profile: author } = useProfile(event?.userId);
  const reactions = useActivityReactions(useMemo(() => (activityId ? [activityId] : []), [activityId]));
  const { comments, postComment, removeComment, posting } = useActivityComments(activityId);
  const commenters = useProfileMap(useMemo(() => comments.map((comment) => comment.userId), [comments]));
  const [draft, setDraft] = useState('');

  const send = async () => {
    try {
      await postComment(draft);
      setDraft('');
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not post that comment');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <NestedHeader title="Activity" />
        <LoadingState label="Loading…" />
      </View>
    );
  }

  const state = activityId ? reactions.reactionsFor(activityId) : null;

  return (
    <View className="flex-1 bg-background">
      <NestedHeader title="Activity" />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ContentShell fill maxWidth={MAX_W.text}>
          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-4 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {!event ? (
              <Text className="text-sm text-muted-foreground">This activity is gone, or is not visible to you.</Text>
            ) : (
              <>
                <View className="gap-3 rounded-2xl border border-border bg-card/50 p-3">
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={() => router.push({ pathname: '/u/[userId]', params: { userId: event.userId } })}
                      hitSlop={6}
                    >
                      <Avatar profile={author} size={36} />
                    </Pressable>
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="text-sm text-foreground">
                        <Text className="font-bold">{author?.displayName || author?.username || 'Someone'}</Text>{' '}
                        <Text className="text-muted-foreground">{activityVerb(event)}</Text>
                      </Text>
                      <Text className="text-[11px] text-muted-foreground">{relativeTime(event.createdAt)}</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() =>
                      event.albumKey
                        ? router.push(ratingHref(event.albumKey))
                        : undefined
                    }
                    className="flex-row items-center gap-3 active:opacity-80"
                  >
                    <View className="h-14 w-14 overflow-hidden rounded-md bg-secondary">
                      <CoverImage uri={coverUrl} iconSize={18} />
                    </View>
                    <Text numberOfLines={2} className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                      {event.albumTitle}
                    </Text>
                  </Pressable>

                  <View className="flex-row items-center gap-2">
                    {REACTIONS.map((reaction) => {
                      const mine = state?.mine.has(reaction.kind) ?? false;
                      const count = state?.counts[reaction.kind] ?? 0;
                      return (
                        <Pressable
                          key={reaction.kind}
                          onPress={() => activityId && reactions.toggleReaction(activityId, reaction.kind)}
                          accessibilityLabel={`React with ${reaction.label}`}
                          className="min-h-[32px] flex-row items-center gap-1.5 rounded-full border px-2.5"
                          style={{
                            borderColor: mine ? COLORS.accent : 'transparent',
                            backgroundColor: mine ? COLORS.accentSoft : 'rgba(255,255,255,0.05)',
                          }}
                        >
                          <Text className="text-sm">{reaction.emoji}</Text>
                          {count > 0 && (
                            <Text className={mine ? 'text-xs font-bold text-primary' : 'text-xs text-muted-foreground'}>
                              {count}
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {comments.length === 0 ? 'No comments yet' : `${comments.length} comment${comments.length === 1 ? '' : 's'}`}
                </Text>

                {comments.map((comment) => {
                  const commenter = commenters.get(comment.userId);
                  const mine = comment.userId === user?.id;
                  return (
                    <View key={comment.id} className="flex-row gap-3">
                      <Avatar profile={commenter ?? null} size={32} />
                      <View className="min-w-0 flex-1 gap-1 rounded-2xl bg-secondary/60 px-3 py-2">
                        <View className="flex-row items-center gap-2">
                          <Text numberOfLines={1} className="min-w-0 flex-1 text-xs font-bold text-foreground">
                            {commenter?.displayName || commenter?.username || 'Someone'}
                          </Text>
                          <Text className="text-[10px] text-muted-foreground">{relativeTime(comment.createdAt)}</Text>
                          {mine && (
                            <Pressable
                              onPress={() => removeComment(comment.id)}
                              accessibilityLabel="Delete your comment"
                              hitSlop={8}
                            >
                              <Trash2 size={13} color={COLORS.muted} />
                            </Pressable>
                          )}
                        </View>
                        <Text className="text-sm leading-snug text-foreground">{comment.body}</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>

          {!!event && (
            <View className="flex-row items-end gap-2 border-t border-border px-4 py-3" style={{ paddingBottom: navBarSpace }}>
              <SearchInput
                value={draft}
                onChangeText={(value) => setDraft(value.slice(0, COMMENT_MAX))}
                placeholder="Say something…"
                placeholderTextColor={COLORS.muted}
                multiline
                className="min-h-11 flex-1 rounded-2xl border border-border bg-secondary px-3 py-2.5 text-foreground"
              />
              <Pressable
                onPress={send}
                disabled={posting || !draft.trim()}
                accessibilityLabel="Post comment"
                className="h-11 w-11 items-center justify-center rounded-full bg-primary"
                style={{ opacity: posting || !draft.trim() ? 0.5 : 1 }}
              >
                {posting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={17} color="#fff" />}
              </Pressable>
            </View>
          )}
        </ContentShell>
      </KeyboardAvoidingView>

      <NavIslands />
    </View>
  );
}
