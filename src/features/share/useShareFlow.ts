import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useToast } from '@/components/ui/Toast';
import { DEFAULT_DRAFT, useQuickAdd, type QuickAddDraft } from '@/features/albums/add/useQuickAdd';
import { useShareOptions } from '@/features/share/useShareOptions';
import { useShareResolution, type ShareTabKind } from '@/features/share/useShareResolution';
import { useAlbumRatings } from '@/hooks/useAlbumRatings';
import type { SpotifyAlbum } from '@/lib/spotify';
import type { AlbumStatus, Format } from '@/types/album';

/**
 * Everything the share sheet does, so the sheet itself only has to lay it out.
 *
 * The shape is: a link resolves to tabs, a tab offers releases, one release is
 * selected, and the three actions apply to it.
 *
 * The tab and the selection are held as *overrides* rather than as synced state:
 * whatever the user last tapped wins while it still exists, and otherwise the
 * first thing the level above offers does. That is why switching tabs needs no
 * effect to clear the previous tab's pick — it simply stops matching. Resetting
 * across shares is the caller's job, by keying this hook's owner on the shared
 * text (features/share/ShareIntentSheet).
 */
export function useShareFlow(text: string | null, onDone: () => void) {
  const router = useRouter();
  const { show } = useToast();
  const { add, isAdded, pendingKey } = useQuickAdd();
  const { scoreFor } = useAlbumRatings();

  const resolution = useShareResolution(text);
  const [tabOverride, setTab] = useState<ShareTabKind | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuickAddDraft>(DEFAULT_DRAFT);

  const tabs = resolution.tabs;
  const tab = tabs.some((entry) => entry.kind === tabOverride) ? tabOverride : tabs[0]?.kind ?? null;

  const { options, loading: optionsLoading } = useShareOptions(resolution, tab);
  // Lead with the first release the tab offers — newest first for an artist, and
  // the only one there is for the release that was actually shared.
  const selected = options.find((release) => release.albumKey === selectedKey) ?? options[0] ?? null;

  const toggleFormat = (format: Format) =>
    setDraft((current) => ({
      ...current,
      formats: current.formats.includes(format)
        ? current.formats.filter((entry) => entry !== format)
        : [...current.formats, format],
    }));

  const addSelected = async (): Promise<boolean> => {
    if (!selected) return false;
    if (isAdded(selected.albumKey)) return true;
    try {
      const album = await add(selected, draft);
      if (album) show(`${album.title} added to your ${draft.status.toLowerCase()}`);
      return true;
    } catch (error) {
      show(error instanceof Error ? error.message : 'Could not add that album');
      return false;
    }
  };

  const openRating = () => {
    if (!selected) return;
    onDone();
    router.push({ pathname: '/release/[albumKey]', params: { albumKey: selected.albumKey } });
  };

  return {
    resolution,
    tabs,
    tab,
    setTab,
    options,
    optionsLoading,
    selected,
    selectRelease: (release: SpotifyAlbum) => setSelectedKey(release.albumKey),
    draft,
    setStatus: (status: AlbumStatus) => setDraft((current) => ({ ...current, status })),
    toggleFormat,
    isAdded,
    scoreFor,
    added: !!selected && isAdded(selected.albumKey),
    pending: !!selected && pendingKey === selected.albumKey,

    /** Shelve it and stay put — the sheet closes, nothing else opens. */
    onAdd: async () => {
      if (await addSelected()) onDone();
    },
    /** Straight to the rating editor, owned or not. */
    onRate: openRating,
    /** Both: the shelf row first, then the editor on top of it. */
    onAddAndRate: async () => {
      if (await addSelected()) openRating();
    },
  };
}
