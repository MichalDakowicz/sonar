import { Check } from 'lucide-react-native';
import { forwardRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Sheet, type BottomSheetModal } from '@/components/ui/Sheet';
import { STATS_PERIODS } from '@/lib/statsPeriod';
import { useStatsPeriod } from '@/store/statsPeriod';
import { COLORS } from '@/theme/colors';

/**
 * The time window Stats reads. Mounted once by the tabs layout so both the nav
 * bar's left action and the pill on the Stats screen open the same instance.
 */
export const StatsPeriodSheet = forwardRef<BottomSheetModal, { onPicked?: () => void }>(function StatsPeriodSheet(
  { onPicked },
  ref,
) {
  const { period, setPeriod } = useStatsPeriod();

  return (
    <Sheet ref={ref} snapPoints={['45%']} contentHeight={260}>
      <View className="gap-1 p-4">
        <Text className="pb-2 text-lg font-bold text-foreground">Time period</Text>
        {STATS_PERIODS.map((option) => {
          const active = option.id === period;
          return (
            <Pressable
              key={option.id}
              onPress={() => {
                setPeriod(option.id);
                onPicked?.();
              }}
              className="min-h-[48px] flex-row items-center justify-between rounded-lg px-3"
              style={{ backgroundColor: active ? COLORS.accentSoft : 'transparent' }}
            >
              <Text className={active ? 'font-semibold text-primary' : 'text-foreground'}>{option.label}</Text>
              {active && <Check size={18} color={COLORS.accent} />}
            </Pressable>
          );
        })}
        <Text className="px-3 pt-3 text-xs text-muted-foreground">
          The window scopes what you played. Collection totals always describe the whole shelf.
        </Text>
      </View>
    </Sheet>
  );
});
