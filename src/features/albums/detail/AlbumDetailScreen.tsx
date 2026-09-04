import { Check, Plus, RefreshCw, Save, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useToast } from '@/components/ui/Toast';
import { FormatStatusPicker } from '@/features/albums/add/FormatStatusPicker';
import { DetailHero } from '@/features/albums/detail/DetailHero';
import { PressingDetails } from '@/features/albums/detail/PressingDetails';
import { SpinHistory } from '@/features/albums/detail/SpinHistory';
import { TrackList } from '@/features/albums/detail/TrackList';
import { useAlbumDetail } from '@/features/albums/detail/useAlbumDetail';
import { useEditAlbumForm } from '@/features/albums/edit/useEditAlbumForm';
import { RatingEditor } from '@/features/ratings/RatingEditor';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { MAX_W, useCenteredContentStyle } from '@/hooks/useResponsive';
import { COLORS } from '@/theme/colors';

type AlbumDetailScreenProps = {
  albumId?: string;
  albumKey?: string;
};

/**
 * One screen for a release, owned or not — the same unification Radar applies
 * to films. Both routes render the same hero, rating editor and track list;
 * ownership only adds the shelf controls (status, formats, pressing details,
 * spins) and swaps the header CTA.
 *
 * Removing a record leaves you right here in the not-owned state, so it can be
 * put back with one tap, and the rating you gave it stays either way.
 */
export function AlbumDetailScreen({ albumId, albumKey }: AlbumDetailScreenProps) {
  const detail = useAlbumDetail({ albumId, albumKey });
  const editForm = useEditAlbumForm(detail.album ?? undefined);
  const contentStyle = useCenteredContentStyle(MAX_W.detail);
  const navBarSpace = useNavBarSpace();
  const { show } = useToast();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const { album, display } = detail;
  const form = editForm.form;

  if (detail.loading && !display) return <LoadingState label="Loading…" />;
  if (!display) {
    return (
      <EmptyState
        title="Album not found"
        description={
          detail.unresolved
            ? 'This release is not on your shelf and Spotify has no record of it.'
            : 'Try opening it again from your collection.'
        }
      />
    );
  }

  const owned = !!album;

  const action = owned ? (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={() => setConfirmRemove(true)}
        className="flex-row items-center gap-2 rounded-full border border-border bg-black/40 px-4 py-2.5 active:opacity-80"
      >
        <Check size={16} color={COLORS.accent} />
        <Text className="text-sm font-semibold text-foreground">On your shelf</Text>
      </Pressable>
      {!!album.spotifyId && (
        <Pressable
          onPress={editForm.refreshMetadata}
          disabled={editForm.isRefreshing}
          accessibilityLabel="Refresh metadata from Spotify"
          className="rounded-full border border-border bg-black/40 p-2.5 active:opacity-80"
        >
          {editForm.isRefreshing ? <ActivityIndicator size="small" color={COLORS.muted} /> : <RefreshCw size={16} color={COLORS.muted} />}
        </Pressable>
      )}
    </View>
  ) : (
    <Pressable
      onPress={async () => {
        const added = await detail.addToShelf();
        if (added) show(`${added.title} added to your collection`);
      }}
      disabled={detail.pending}
      className="flex-row items-center justify-center gap-2 self-start rounded-full bg-primary px-5 py-3 active:opacity-80"
      style={{ opacity: detail.pending ? 0.6 : 1 }}
    >
      {detail.pending ? <ActivityIndicator size="small" color="#fff" /> : <Plus size={16} color="#fff" />}
      <Text className="font-semibold text-primary-foreground">Add to collection</Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={[contentStyle, { paddingBottom: navBarSpace + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <DetailHero
          title={display.title}
          artist={display.artist}
          coverUrl={display.coverUrl}
          releaseDate={display.releaseDate}
          releaseDatePrecision={display.releaseDatePrecision}
          totalTracks={display.totalTracks}
          ratings={detail.ratings}
          action={action}
        />

        <View className="gap-8 px-4 pt-6">
          {/* Rating comes first, and is here whether or not you own it — that is
              the whole point of keeping ratings in their own table. */}
          <RatingEditor
            target={{
              albumKey: display.albumKey,
              spotifyId: display.spotifyId,
              title: display.title,
              artist: display.artist,
              coverUrl: display.coverUrl,
              releaseDate: display.releaseDate,
            }}
            note={owned ? undefined : 'You can rate this without adding it — the score is kept against the release.'}
          />

          {owned && form && (
            <>
              <View className="gap-4">
                <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">On your shelf</Text>
                <FormatStatusPicker
                  status={form.status}
                  formats={form.formats}
                  onStatusChange={(status) => editForm.update({ status })}
                  onToggleFormat={editForm.toggleFormat}
                />
              </View>

              <SpinHistory
                spins={detail.spins}
                onLogSpin={async () => {
                  await detail.logSpin();
                  show(`Spin logged for ${display.title}`);
                }}
                onRemoveSpin={detail.removeSpin}
              />

              <PressingDetails form={form} issues={editForm.issues} onChange={editForm.update} />
            </>
          )}

          {display.genres.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Genres</Text>
              <View className="flex-row flex-wrap gap-2">
                {display.genres.map((genre) => (
                  <View key={genre} className="rounded-full border border-border px-3 py-1.5">
                    <Text className="text-xs text-muted-foreground">{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TrackList spotifyId={display.spotifyId} />
        </View>
      </ScrollView>

      {owned && form && editForm.dirty && (
        <Pressable
          onPress={async () => {
            const saved = await editForm.save();
            show(saved ? 'Changes saved' : 'Fix the highlighted fields first');
          }}
          disabled={editForm.isSaving}
          accessibilityLabel="Save changes"
          className="absolute bottom-28 right-6 h-16 w-16 items-center justify-center rounded-full bg-primary shadow-xl"
          style={{ opacity: editForm.isSaving ? 0.6 : 1 }}
        >
          {editForm.isSaving ? <ActivityIndicator color="#fff" /> : <Save size={26} color="#fff" />}
        </Pressable>
      )}

      <ConfirmDialog
        visible={confirmRemove}
        title="Remove from collection"
        description={`Take "${display.title}" off your shelf? Your rating and review are kept — they belong to the release, not the copy.`}
        confirmLabel="Remove"
        destructive
        loading={editForm.isSaving}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={async () => {
          setConfirmRemove(false);
          await detail.removeFromShelf();
          show(`${display.title} removed`);
        }}
      />
    </View>
  );
}

/** The trash affordance used by the collection's long-press menu. */
export function RemoveAlbumButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-2 px-2 py-2 active:opacity-70">
      <Trash2 size={16} color={COLORS.danger} />
      <Text className="text-sm text-red-400">Remove from collection</Text>
    </Pressable>
  );
}
