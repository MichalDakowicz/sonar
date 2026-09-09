import { Disc3 } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { FormatStatusPicker } from '@/features/albums/add/FormatStatusPicker';
import { ShareActions } from '@/features/share/ShareActions';
import { ShareReleaseList } from '@/features/share/ShareReleaseList';
import { ShareSubjectHeader } from '@/features/share/ShareSubjectHeader';
import { ShareTabBar } from '@/features/share/ShareTabBar';
import { useShareFlow } from '@/features/share/useShareFlow';
import { COLORS } from '@/theme/colors';

const EMPTY_COPY: Record<string, { title: string; description: string }> = {
  single: {
    title: 'No single for that song',
    description: 'Spotify lists no single release of it. Its album is on the other tab.',
  },
  artistAlbums: { title: 'No albums', description: 'Spotify lists no albums for this artist.' },
  artistSingles: { title: 'No singles', description: 'Spotify lists no singles for this artist.' },
};

/**
 * The inside of the share sheet, for one share.
 *
 * Its own component because the sheet keys it on the shared text: a second
 * share arriving remounts this and every choice starts clean, which beats an
 * effect that has to remember to clear the tab, the pick and the formats.
 */
export function ShareFlowBody({ text, onDone }: { text: string | null; onDone: () => void }) {
  const flow = useShareFlow(text, onDone);
  const { resolution } = flow;

  if (resolution.unconfigured) {
    return (
      <EmptyState
        icon={<Disc3 size={36} color={COLORS.mutedDeep} />}
        title="Spotify lookup is off"
        description="Add EXPO_PUBLIC_SPOTIFY_CLIENT_ID and _SECRET to .env to resolve shared links."
      />
    );
  }

  if (resolution.error) {
    return (
      <EmptyState
        title="Could not read that share"
        description={resolution.error instanceof Error ? resolution.error.message : 'Try sharing it again.'}
      />
    );
  }

  if (resolution.unsupported) {
    return (
      <EmptyState
        icon={<Disc3 size={36} color={COLORS.mutedDeep} />}
        title="Not something Sonar can shelve"
        description="Share a song, a single, an album or an artist from Spotify — a playlist has no release behind it."
      />
    );
  }

  if (!resolution.subject) return <LoadingState label="Reading the link…" />;

  const empty = EMPTY_COPY[flow.tab ?? ''] ?? {
    title: 'Nothing to add',
    description: 'Spotify returned no release for that link.',
  };

  return (
    <>
      <ShareSubjectHeader subject={resolution.subject} />

      <ShareTabBar tabs={flow.tabs} active={flow.tab} onChange={flow.setTab} />

      {(flow.tab === 'artistAlbums' || flow.tab === 'artistSingles') && !!resolution.subject.artistName && (
        <Text className="text-xs text-muted-foreground">
          Everything Spotify lists by {resolution.subject.artistName} — pick the release you mean.
        </Text>
      )}

      <ShareReleaseList
        options={flow.options}
        loading={flow.optionsLoading}
        selectedKey={flow.selected?.albumKey ?? null}
        onSelect={flow.selectRelease}
        isAdded={flow.isAdded}
        scoreFor={flow.scoreFor}
        emptyTitle={empty.title}
        emptyDescription={empty.description}
      />

      {!!flow.selected && (
        <View className="gap-5">
          <FormatStatusPicker
            status={flow.draft.status}
            formats={flow.draft.formats}
            onStatusChange={flow.setStatus}
            onToggleFormat={flow.toggleFormat}
          />

          <ShareActions
            added={flow.added}
            pending={flow.pending}
            onAdd={flow.onAdd}
            onRate={flow.onRate}
            onAddAndRate={flow.onAddAndRate}
          />
        </View>
      )}
    </>
  );
}
