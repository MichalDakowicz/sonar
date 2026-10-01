import { BellOff } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { ensureNotificationPermission, supportsNotifications } from '@/features/notifications/notificationSetup';
import { useNotificationPermission } from '@/features/notifications/useNotificationPermission';
import { REMINDER_TEXT } from '@/lib/reminderCopy';
import { useReminderPrefs } from '@/store/reminderPrefs';
import { COLORS } from '@/theme/colors';

import { ReminderTimeStepper } from './ReminderTimeStepper';
import { Segmented } from './Segmented';
import { SettingLabel } from './SettingsSection';

const OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'on', label: 'On' },
] as const;

/**
 * The daily reminder: a switch, and when it lands once it is on. Identical in
 * Lidar and Sonar; the wording is lib/reminderCopy.
 *
 * Turning it on is what asks Android for permission, so the sheet appears in
 * answer to a switch the person just flipped. A refusal does not turn the switch
 * back off: it stays set, and the banner says what is in the way.
 */
export function ReminderControl() {
  const { enabled, hour, minute, setEnabled, setTime } = useReminderPrefs();
  const { granted, request } = useNotificationPermission();

  const change = (next: 'on' | 'off') => {
    setEnabled(next === 'on');
    if (next === 'on') void ensureNotificationPermission();
  };

  return (
    <>
      <SettingLabel title={REMINDER_TEXT.title} description={REMINDER_TEXT.description} />

      {!supportsNotifications && <Text className="text-xs text-muted-foreground">{REMINDER_TEXT.needsApp}</Text>}

      <Segmented columns={2} options={[...OPTIONS]} value={enabled ? 'on' : 'off'} onChange={change} />

      {enabled && supportsNotifications && granted === false && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Allow notifications"
          onPress={() => void request()}
          className="flex-row items-center gap-3 rounded-xl border border-border bg-secondary p-3 active:opacity-70"
        >
          <BellOff size={18} color={COLORS.accent} />
          <Text className="flex-1 text-xs text-foreground">{REMINDER_TEXT.blocked}</Text>
        </Pressable>
      )}

      {enabled && <ReminderTimeStepper value={{ hour, minute }} onChange={setTime} />}
    </>
  );
}
