import * as IntentLauncher from 'expo-intent-launcher';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { siblingsOf, type PingApp } from '@/lib/pingApps';

import { SELF } from './siblingHandoff';

export type InstalledSibling = {
  app: PingApp;
  /** The sibling's own launcher icon as a data URI, or null if Android had none to give. */
  icon: string | null;
};

/**
 * The other Ping apps on this phone, in family order. Empty on web and iOS,
 * where there is nothing to hand a sign-in over with.
 *
 * Asking Android for the icon doubles as the install check: it throws for a
 * package that is not there. Both need the `<queries>` entries the
 * withPingSiblings plugin writes — without them Android 11+ reports every
 * sibling as missing.
 */
export function useInstalledSiblings(): InstalledSibling[] {
  const [installed, setInstalled] = useState<InstalledSibling[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !SELF) return;
    let live = true;

    Promise.all(
      siblingsOf(SELF.key).map(async (app): Promise<InstalledSibling | null> => {
        try {
          const icon = await IntentLauncher.getApplicationIconAsync(app.androidPackage);
          return { app, icon: icon || null };
        } catch {
          return null;
        }
      }),
    ).then((found) => {
      if (live) setInstalled(found.filter((sibling): sibling is InstalledSibling => sibling !== null));
    });

    return () => {
      live = false;
    };
  }, []);

  return installed;
}
