import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { stepHour, stepMinute, type TimeOfDay } from '@/lib/reminderTime';
import { COLORS } from '@/theme/colors';

function Column({
  text,
  later,
  earlier,
  unit,
}: {
  text: string;
  later: () => void;
  earlier: () => void;
  unit: string;
}) {
  return (
    <View className="items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Later ${unit}`}
        onPress={later}
        className="h-11 w-16 items-center justify-center rounded-lg bg-secondary active:opacity-60"
      >
        <ChevronUp size={18} color={COLORS.foreground} />
      </Pressable>
      <Text className="text-3xl font-bold tracking-tight text-foreground">{text}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Earlier ${unit}`}
        onPress={earlier}
        className="h-11 w-16 items-center justify-center rounded-lg bg-secondary active:opacity-60"
      >
        <ChevronDown size={18} color={COLORS.foreground} />
      </Pressable>
    </View>
  );
}

/**
 * Hour and quarter-hour, each with its own up and down. The boxes are 44pt tall,
 * the smallest a thumb reliably hits. Identical in Lidar and Sonar.
 */
export function ReminderTimeStepper({ value, onChange }: { value: TimeOfDay; onChange: (time: TimeOfDay) => void }) {
  return (
    <View className="flex-row items-center justify-center gap-4 rounded-xl border border-border p-3">
      <Column
        text={String(value.hour).padStart(2, '0')}
        unit="hour"
        later={() => onChange(stepHour(value, 1))}
        earlier={() => onChange(stepHour(value, -1))}
      />
      <Text className="text-3xl font-bold text-muted-foreground">:</Text>
      <Column
        text={String(value.minute).padStart(2, '0')}
        unit="minute"
        later={() => onChange(stepMinute(value, 1))}
        earlier={() => onChange(stepMinute(value, -1))}
      />
    </View>
  );
}
