import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

import {
  currentAppVersion,
  fetchLatestRelease,
  isNewerVersion,
  RELEASES_PAGE_URL,
  shouldShowUpdateNotice,
  type LatestRelease,
} from '@/lib/appUpdate';

const storage = createMMKV({ id: 'sonar-updates' });
const DISMISSED_KEY = 'dismissed_version';

// Only the Android build is distributed as a downloadable artifact. Web reloads
// itself on deploy, and there is no iOS build to point anywhere.
export const UPDATES_SUPPORTED = Platform.OS === 'android';

const SIX_HOURS = 6 * 60 * 60 * 1000;

/**
 * Latest GitHub release plus whether it is newer than the installed build.
 * Shared by the launch notice and the Settings row, so both read one query.
 */
export function useLatestRelease() {
  const installedVersion = currentAppVersion();

  const query = useQuery({
    queryKey: ['app-update', installedVersion],
    queryFn: () => fetchLatestRelease(),
    enabled: UPDATES_SUPPORTED,
    staleTime: SIX_HOURS,
    gcTime: SIX_HOURS,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const release = query.data ?? null;
  const hasUpdate = !!release && isNewerVersion(release.version, installedVersion);

  return { ...query, installedVersion, release, hasUpdate };
}

/** Sends the user to the APK asset, falling back to the releases page. */
export function openDownload(release: LatestRelease | null) {
  return Linking.openURL(release?.apkUrl ?? release?.pageUrl ?? RELEASES_PAGE_URL);
}

/**
 * Adds "don't show this again" on top of `useLatestRelease`. The dismissal is
 * keyed by version so the next release surfaces a fresh notice.
 */
export function useAppUpdateNotice() {
  const { release, installedVersion } = useLatestRelease();
  const [dismissedVersion, setDismissedVersion] = useState(() => storage.getString(DISMISSED_KEY) ?? null);

  const dismiss = useCallback(() => {
    if (!release) return;
    storage.set(DISMISSED_KEY, release.version);
    setDismissedVersion(release.version);
  }, [release]);

  const visible = UPDATES_SUPPORTED && shouldShowUpdateNotice(release, installedVersion, dismissedVersion);

  return { release, visible, installedVersion, dismiss };
}
