import { Pressable, Text, View } from 'react-native';

import { FormatGlyph, StatusGlyph } from '@/components/media/Glyphs';
import { STATUSES } from '@/lib/albumStatus';
import { FORMATS } from '@/lib/formats';
import { COLORS } from '@/theme/colors';
import type { AlbumStatus, Format } from '@/types/album';

type FormatStatusPickerProps = {
  status: AlbumStatus;
  formats: Format[];
  onStatusChange: (status: AlbumStatus) => void;
  onToggleFormat: (format: Format) => void;
};

/**
 * The two questions every add and edit asks: where does it sit, and what do you
 * own it on. One component, used by the Quick-Add sheet and the album editor, so
 * the controls cannot drift apart between the two.
 *
 * Status is single-choice and formats are multi — a record can be on vinyl and
 * digital at once, but it cannot be both wishlisted and owned.
 */
export function FormatStatusPicker({ status, formats, onStatusChange, onToggleFormat }: FormatStatusPickerProps) {
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</Text>
        <View className="flex-row gap-2">
          {STATUSES.map((option) => {
            const active = status === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onStatusChange(option.value)}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border py-2.5"
                style={{
                  borderColor: active ? option.color : 'hsl(0 0% 20%)',
                  backgroundColor: active ? option.tint : 'transparent',
                }}
              >
                <StatusGlyph status={option.value} size={15} color={active ? option.color : COLORS.muted} />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: active ? option.color : COLORS.muted }}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Formats</Text>
        <View className="flex-row flex-wrap gap-2">
          {FORMATS.map((option) => {
            const active = formats.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => onToggleFormat(option.value)}
                className="flex-row items-center gap-2 rounded-lg border px-3.5 py-2"
                style={{
                  borderColor: active ? COLORS.accent : 'hsl(0 0% 20%)',
                  backgroundColor: active ? COLORS.accentSoft : 'transparent',
                }}
              >
                <FormatGlyph format={option.value} size={14} color={active ? COLORS.accent : COLORS.muted} />
                <Text className={active ? 'text-xs font-bold text-primary' : 'text-xs font-semibold text-muted-foreground'}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
