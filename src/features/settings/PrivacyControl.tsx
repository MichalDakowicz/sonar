import { Globe, Lock, Users } from 'lucide-react-native';

import { type FriendsVisibility, useUserSettings } from '@/hooks/useUserSettings';

import { Segmented } from './Segmented';
import { SettingLabel } from './SettingsSection';

const MUTED = 'hsl(0 0% 63.9%)';

const OPTIONS: { value: FriendsVisibility; label: string; icon: React.ReactNode }[] = [
  { value: 'noone', label: 'Only Me', icon: <Lock size={20} color={MUTED} /> },
  { value: 'friends', label: 'Friends', icon: <Users size={20} color={MUTED} /> },
  { value: 'public', label: 'Public', icon: <Globe size={20} color={MUTED} /> },
];

// friends_visibility gates the whole public shelf server-side (private.can_view
// reads this column - doc 11). Editing it here changes what strangers/friends
// can see of your library, activity, and friends list.
export function PrivacyControl() {
  const { settings, updateSettings } = useUserSettings();
  return (
    <>
      <SettingLabel title="Profile visibility" description="Who can see your public shelf, stats, and friends" />
      <Segmented
        options={OPTIONS}
        value={settings.friendsVisibility}
        onChange={(friendsVisibility) => void updateSettings({ friendsVisibility })}
      />
    </>
  );
}
