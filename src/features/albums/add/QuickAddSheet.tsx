import { useRouter } from 'expo-router';
import { PenLine, Search } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheetTextInput, Sheet, type BottomSheetModal } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { AddSearchResults } from '@/features/albums/add/AddSearchResults';
import { FormatStatusPicker } from '@/features/albums/add/FormatStatusPicker';
import { DEFAULT_DRAFT, useQuickAdd, type QuickAddDraft } from '@/features/albums/add/useQuickAdd';
import { useSpotifySearch } from '@/features/albums/add/useSpotifySearch';
import { artistList } from '@/lib/albumKey';
import type { SpotifyAlbum } from '@/lib/spotify';
import { COLORS } from '@/theme/colors';
import type { Format } from '@/types/album';

/**
 * Add an album from anywhere: mounted once by the tabs layout, opened by the
 * nav bar's left action on the collection tab.
 *
 * Search first, manual second — the legacy modal made you choose a mode up
 * front, and typing a title you own is the overwhelmingly common case. The
 * status/format picker sits above the results because it applies to whatever
 * you pick next, and the defaults (Collection, Digital) are what most adds want.
 */
export const QuickAddSheet = forwardRef<BottomSheetModal>(function QuickAddSheet(_props, ref) {
  const router = useRouter();
  const { show } = useToast();
  const [term, setTerm] = useState('');
  const [draft, setDraft] = useState<QuickAddDraft>(DEFAULT_DRAFT);
  const [manual, setManual] = useState({ title: '', artist: '' });
  const [manualOpen, setManualOpen] = useState(false);
  const { results, loading, unconfigured } = useSpotifySearch(term);
  const { add, addManual, isAdded, pendingKey } = useQuickAdd();

  const dismiss = () => (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();

  const toggleFormat = (format: Format) =>
    setDraft((current) => ({
      ...current,
      formats: current.formats.includes(format)
        ? current.formats.filter((entry) => entry !== format)
        : [...current.formats, format],
    }));

  const handleAdd = async (release: SpotifyAlbum) => {
    try {
      const album = await add(release, draft);
      if (album) show(`${album.title} added to your ${draft.status.toLowerCase()}`);
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not add that album');
    }
  };

  // Opening the release page is the path that also lets you rate something you
  // are not adding, so the sheet closes rather than sitting behind it.
  const handleSelect = (release: SpotifyAlbum) => {
    dismiss();
    router.push({ pathname: '/release/[albumKey]', params: { albumKey: release.albumKey } });
  };

  const handleManualAdd = async () => {
    const title = manual.title.trim();
    if (!title) return show('Give the album a title first');
    try {
      const album = await addManual({ title, artist: artistList(manual.artist) }, draft);
      if (album) {
        show(`${album.title} added`);
        setManual({ title: '', artist: '' });
        setManualOpen(false);
        dismiss();
        router.push({ pathname: '/album/[albumId]', params: { albumId: album.id } });
      }
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not add that album');
    }
  };

  return (
    <Sheet ref={ref} snapPoints={['70%', '92%']}>
      <ScrollView contentContainerClassName="gap-5 p-4 pb-8" keyboardShouldPersistTaps="handled">
        <Text className="text-lg font-bold text-foreground">Add an album</Text>

        <View className="relative">
          <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
            <Search size={18} color={COLORS.muted} />
          </View>
          <BottomSheetTextInput
            value={term}
            onChangeText={setTerm}
            placeholder="Album, artist, or a Spotify link"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
            className="h-11 rounded-lg border border-border bg-secondary pl-10 pr-3 text-foreground"
          />
        </View>

        <FormatStatusPicker
          status={draft.status}
          formats={draft.formats}
          onStatusChange={(status) => setDraft((current) => ({ ...current, status }))}
          onToggleFormat={toggleFormat}
        />

        <AddSearchResults
          results={results}
          loading={loading}
          query={term}
          unconfigured={unconfigured}
          isAdded={isAdded}
          pendingKey={pendingKey}
          onSelect={handleSelect}
          onAdd={handleAdd}
        />

        <View className="gap-3 border-t border-border pt-4">
          {manualOpen ? (
            <>
              <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Add by hand</Text>
              <BottomSheetTextInput
                value={manual.title}
                onChangeText={(title) => setManual((current) => ({ ...current, title }))}
                placeholder="Album title"
                placeholderTextColor={COLORS.muted}
                className="h-11 rounded-lg border border-border bg-secondary px-3 text-foreground"
              />
              <BottomSheetTextInput
                value={manual.artist}
                onChangeText={(artist) => setManual((current) => ({ ...current, artist }))}
                placeholder="Artist (separate several with ;)"
                placeholderTextColor={COLORS.muted}
                className="h-11 rounded-lg border border-border bg-secondary px-3 text-foreground"
              />
              <Pressable
                onPress={handleManualAdd}
                className="items-center rounded-full bg-primary py-3 active:opacity-80"
                disabled={!manual.title.trim()}
                style={{ opacity: manual.title.trim() ? 1 : 0.5 }}
              >
                <Text className="font-semibold text-primary-foreground">Add and open</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => setManualOpen(true)}
              className="flex-row items-center justify-center gap-2 rounded-full border border-border py-3 active:opacity-80"
            >
              <PenLine size={16} color={COLORS.foreground} />
              <Text className="font-medium text-foreground">Not on Spotify? Add by hand</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Sheet>
  );
});
