// public.user_settings is Radar's table and Sonar shares the row, because it is
// one account: `friends_visibility` is what private.can_view() reads, so the
// privacy switch has to mean the same thing in both apps or a shelf you closed
// in one would still be open in the other.
//
// Sonar therefore reads and writes only the two columns that are genuinely
// shared preferences — visibility and theme — and leaves every Radar-specific
// column (streak thresholds, watch-provider country, notification prefs)
// untouched. A sparse upsert of the two keys below cannot clobber them.

export type ThemePref = 'dark' | 'light' | 'system';
export type FriendsVisibility = 'public' | 'friends' | 'noone';

export type UserSettings = {
  friendsVisibility: FriendsVisibility;
  theme: ThemePref;
};

export type UserSettingsRow = {
  friends_visibility: FriendsVisibility | null;
  theme: string | null;
};

export const DEFAULT_SETTINGS: UserSettings = {
  friendsVisibility: 'friends',
  theme: 'dark',
};

export function normalizeSettings(row: UserSettingsRow): UserSettings {
  const visibility = row.friends_visibility;
  return {
    friendsVisibility: visibility === 'public' || visibility === 'noone' ? visibility : 'friends',
    theme: row.theme === 'light' || row.theme === 'system' ? row.theme : 'dark',
  };
}

const TO_COLUMN: Record<keyof UserSettings, keyof UserSettingsRow> = {
  friendsVisibility: 'friends_visibility',
  theme: 'theme',
};

/** A patch, keyed by column. Unknown keys are dropped rather than sent. */
export function settingsToRow(patch: Partial<UserSettings>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    const column = TO_COLUMN[key as keyof UserSettings];
    if (column) row[column] = value;
  }
  return row;
}
