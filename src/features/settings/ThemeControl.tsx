import { useUserSettings, type ThemePref } from '@/hooks/useUserSettings';
import { useTheme } from '@/theme/ThemeProvider';

import { Segmented } from './Segmented';
import { SettingLabel } from './SettingsSection';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

export function ThemeControl() {
  const { theme, setTheme } = useTheme();
  const { updateSettings } = useUserSettings();

  const change = (next: ThemePref) => {
    setTheme(next); // instant, local (MMKV + nativewind colorScheme)
    void updateSettings({ theme: next }); // durable, cross-device
  };

  return (
    <>
      <SettingLabel title="Theme" description="Dark, light, or follow the system setting" />
      <Segmented options={OPTIONS} value={theme} onChange={change} />
    </>
  );
}
