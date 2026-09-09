import { Disc3 } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { FormatStatusPicker } from '@/features/albums/add/FormatStatusPicker';
import { ShareActions } from '@/features/share/ShareActions';
import { ShareOptionList } from '@/features/share/ShareOptionList';
import { ShareSubjectHeader } from '@/features/share/ShareSubjectHeader';
import { ShareTabBar } from '@/features/share/ShareTabBar';
import { useShareFlow } from '@/features/share/useShareFlow';
import type { ShareTabKind } from '@/features/share/useShareResolution';
import { COLORS } from '@/theme/colors';

const EMPTY_COPY: Record<ShareTabKind, { title: string; description: string }> = {
  song: { title: 'No song', description: 'That link does not point at a single track.' },
  album: { title: 'No release', description: 'Spotify returned no release for that link.' },
  artist: { title: 'No artist', description: 'Spotify has no artist behind that link.' },
  artistAlbums: { title: 'No albums', description: 'Spotify lists no albums for this artist.' },
  artistSingles: { title: 'No singles', description: 'Spotify lists no singles for this artist.' },
};

const SCOPE_NOTE: Partial<Record<ShareTabKind, string>> = {
  song: 'Rating the song itself, not the record it came off — those are two different opinions.',
  artist: 'Rating the artist, not one release: this is the score for the body of work.',
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
        title="Not something Sonar can hold an opinion about"
        description="Share a song, a single, an album or an artist from Spotify — a playlist is somebody else's running order."
      />
    );
  }

  if (!resolution.subject) return <LoadingState label="Reading the link…" />;

  const empty = flow.tab
    ? EMPTY_COPY[flow.tab]
    : { title: 'Nothing to act on', description: 'Spotify returned nothing for that link.' };
  const note = flow.tab ? SCOPE_NOTE[flow.tab] : undefined;
  const browsingArtist = flow.tab === 'artistAlbums' || flow.tab === 'artistSingles';

  return (
    <>
      <ShareSubjectHeader subject={resolution.subject} />

      <ShareTabBar tabs={flow.tabs} active={flow.tab} onChange={flow.setTab} />

      {!!note && <Text className="text-xs text-muted-foreground">{note}</Text>}

      {browsingArtist && !!resolution.subject.artistName && (
        <Text className="text-xs text-muted-foreground">
          Everything Spotify lists by {resolution.subject.artistName} — pick the release you mean.
        </Text>
      )}

      <ShareOptionList
        options={flow.options}
        loading={flow.optionsLoading}
        selectedKey={flow.selected?.candidate.key ?? null}
        onSelect={flow.selectOption}
        isAdded={flow.isAdded}
        scoreFor={flow.scoreFor}
        emptyTitle={empty.title}
        emptyDescription={empty.description}
      />

      {!!flow.selected && (
        <View className="gap-5">
          {/* Status and formats are about a copy you own, so they are hidden
              for the two subjects that cannot be owned. */}
          {flow.shelvable && (
            <FormatStatusPicker
              status={flow.draft.status}
              formats={flow.draft.formats}
              onStatusChange={flow.setStatus}
              onToggleFormat={flow.toggleFormat}
            />
          )}

          <ShareActions
            shelvable={flow.shelvable}
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
