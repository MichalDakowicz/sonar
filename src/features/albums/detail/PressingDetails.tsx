import { Text, TextInput, View } from 'react-native';

import { COLORS } from '@/theme/colors';

import type { AlbumForm, FormIssues } from '../edit/albumForm';

type PressingDetailsProps = {
  form: AlbumForm;
  issues: FormIssues;
  onChange: (patch: Partial<AlbumForm>) => void;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  prefix,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'decimal-pad';
  prefix?: string;
  multiline?: boolean;
}) {
  return (
    <View className="min-w-0 flex-1 gap-1.5">
      <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Text>
      <View className="relative">
        {!!prefix && (
          <View className="absolute bottom-0 left-3 top-0 z-10 justify-center">
            <Text className="text-sm text-muted-foreground">{prefix}</Text>
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.muted}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={keyboardType === 'decimal-pad' ? 'none' : 'sentences'}
          className={`rounded-lg border bg-secondary py-2.5 text-sm text-foreground ${prefix ? 'pl-7 pr-3' : 'px-3'} ${
            multiline ? 'min-h-24 leading-relaxed' : ''
          }`}
          style={{ borderColor: error ? COLORS.danger : 'hsl(0 0% 14.9%)' }}
        />
      </View>
      {!!error && <Text className="text-xs text-red-400">{error}</Text>}
    </View>
  );
}

/**
 * The part of an album that is about *your* copy rather than the release:
 * where it came from, what it cost, its catalogue number, the tracks you keep
 * coming back to, and your notes.
 *
 * Only shown for a record you actually have — a wishlist entry has no pressing
 * yet, and asking what you paid for something you do not own is nonsense.
 */
export function PressingDetails({ form, issues, onChange }: PressingDetailsProps) {
  return (
    <View className="gap-5">
      <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your copy</Text>

      <Field
        label="Favourite tracks"
        value={form.favoriteTracks}
        onChangeText={(favoriteTracks) => onChange({ favoriteTracks })}
        placeholder="Side A opener, track 4…"
      />

      <View className="flex-row gap-4">
        <Field
          label="Acquired"
          value={form.acquisitionDate}
          onChangeText={(acquisitionDate) => onChange({ acquisitionDate })}
          placeholder="YYYY-MM-DD"
          error={issues.acquisitionDate}
        />
        <Field
          label="Store / source"
          value={form.storeName}
          onChangeText={(storeName) => onChange({ storeName })}
          placeholder="Local record shop"
        />
      </View>

      <View className="flex-row gap-4">
        <Field
          label="Price paid"
          value={form.pricePaid}
          onChangeText={(pricePaid) => onChange({ pricePaid })}
          placeholder="0.00"
          keyboardType="decimal-pad"
          prefix="¤"
          error={issues.pricePaid}
        />
        <Field
          label="Catalogue no."
          value={form.catalogNumber}
          onChangeText={(catalogNumber) => onChange({ catalogNumber })}
          placeholder="ABC-1234"
        />
      </View>

      <Field
        label="Notes"
        value={form.notes}
        onChangeText={(notes) => onChange({ notes })}
        placeholder="Pressing quality, where you were when you first heard it…"
        multiline
      />

      <Field
        label="Album link"
        value={form.url}
        onChangeText={(url) => onChange({ url })}
        placeholder="https://open.spotify.com/album/…"
      />

      <Field
        label="Cover image URL"
        value={form.coverUrl}
        onChangeText={(coverUrl) => onChange({ coverUrl })}
        placeholder="https://…"
      />
    </View>
  );
}
