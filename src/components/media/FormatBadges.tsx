import { Text, View } from 'react-native';

import { FormatGlyph, StatusGlyph } from '@/components/media/Glyphs';
import { statusMeta } from '@/lib/albumStatus';
import type { Album, AlbumStatus, Format } from '@/types/album';

/**
 * The formats a release is owned on, as icons. Icons rather than words because
 * a record owned on three media would otherwise need a line of its own on every
 * card, and the glyphs are the same ones the format filter uses.
 */
export function FormatBadges({ formats, size = 12 }: { formats: Format[]; size?: number }) {
  if (formats.length === 0) return null;

  return (
    <View className="flex-row items-center gap-1">
      {formats.map((format) => (
        <View key={format} className="rounded bg-black/55 p-1">
          <FormatGlyph format={format} size={size} color="#e4e4e7" />
        </View>
      ))}
    </View>
  );
}

/** Formats as text, for the rows and detail screens that have the width. */
export function FormatLine({ formats }: { formats: Format[] }) {
  if (formats.length === 0) return null;
  return <Text className="text-xs text-muted-foreground">{formats.join(' • ')}</Text>;
}

/**
 * The shelf status, drawn only when it is not the default. `Collection` is the
 * common case and a badge on nearly every card is noise, not information — a
 * wishlist or pre-order is the thing worth flagging.
 */
export function StatusBadge({ status, size = 13 }: { status: AlbumStatus; size?: number }) {
  if (status === 'Collection') return null;
  const meta = statusMeta(status);

  return (
    <View className="rounded bg-black/55 p-1">
      <StatusGlyph status={status} size={size} color={meta.color} filled />
    </View>
  );
}

/** Status as a labelled pill, for detail screens and pickers. */
export function StatusPill({ album }: { album: Album }) {
  const meta = statusMeta(album.status);

  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${meta.color}22` }}
    >
      <StatusGlyph status={album.status} color={meta.color} />
      <Text className="text-xs font-semibold" style={{ color: meta.color }}>
        {meta.label}
      </Text>
    </View>
  );
}
