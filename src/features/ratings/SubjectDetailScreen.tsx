import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { RatingEditor } from '@/features/ratings/RatingEditor';
import { SubjectArtwork } from '@/features/ratings/SubjectArtwork';
import { useSubjectDetail } from '@/features/ratings/useSubjectDetail';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { MAX_W, useCenteredContentStyle } from '@/hooks/useResponsive';
import { candidateByline, candidateTarget } from '@/lib/spotifySubjects';
import { COLORS } from '@/theme/colors';

const NOTES = {
  song: 'A song scores on its own — a great single off a weak record is a normal thing to think.',
  artist: 'This is the artist, not one record: score the body of work.',
} as const;

/**
 * The rating page for a song or an artist.
 *
 * Separate from AlbumDetailScreen because almost everything that screen does is
 * about a copy you own — status, formats, pressing details, the spin log — and
 * none of it applies here. What is left is the hero and the rating editor,
 * which is the whole screen.
 */
export function SubjectDetailScreen({ subjectKey }: { subjectKey: string }) {
  const router = useRouter();
  const detail = useSubjectDetail(subjectKey);
  const contentStyle = useCenteredContentStyle(MAX_W.detail);
  const navBarSpace = useNavBarSpace();

  if (detail.loading) return <LoadingState label="Loading…" />;

  if (!detail.candidate) {
    return (
      <EmptyState
        title={detail.subject === 'artist' ? 'Artist not found' : 'Song not found'}
        description="Spotify has no record of it, and you have not rated it, so there is nothing to show."
      />
    );
  }

  const { candidate } = detail;
  const byline = candidateByline(candidate);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={[contentStyle, { paddingBottom: navBarSpace + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-3 px-4 pb-2 pt-6">
          <SubjectArtwork subject={candidate.subject} uri={candidate.coverUrl} size={168} />
          <Text className="text-center text-2xl font-black text-foreground">{candidate.title}</Text>
          <Text className="text-center text-sm text-muted-foreground">
            {[byline, candidate.context].filter(Boolean).join(' • ')}
          </Text>
        </View>

        <View className="gap-8 px-4 pt-6">
          {!!candidate.parent && (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/release/[albumKey]', params: { albumKey: candidate.parent!.key } })
              }
              className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80"
            >
              <View className="min-w-0 flex-1">
                <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  From the release
                </Text>
                <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                  {candidate.parent.title}
                </Text>
              </View>
              <ChevronRight size={18} color={COLORS.muted} />
            </Pressable>
          )}

          <RatingEditor target={candidateTarget(candidate)} note={NOTES[candidate.subject as 'song' | 'artist']} />
        </View>
      </ScrollView>
    </View>
  );
}
