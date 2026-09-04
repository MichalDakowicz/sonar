import { CassetteTape, Clock, Disc, Disc3, FileAudio, Heart, Library, type LucideIcon } from 'lucide-react-native';

import type { AlbumStatus, Format } from '@/types/album';

/**
 * The glyph for each format and each shelf status.
 *
 * Split from lib/formats and lib/albumStatus so those stay free of React: a
 * lucide import pulls in react-native, which makes the pure rules untestable
 * outside a renderer and unusable from a node script. The tables here are the
 * only place a status or format maps to a picture.
 */
const FORMAT_ICONS: Record<Format, LucideIcon> = {
  Vinyl: Disc,
  CD: Disc3,
  Cassette: CassetteTape,
  Digital: FileAudio,
};

const STATUS_ICONS: Record<AlbumStatus, LucideIcon> = {
  Collection: Library,
  Wishlist: Heart,
  'Pre-order': Clock,
};

export function formatIcon(format: string): LucideIcon {
  return FORMAT_ICONS[format as Format] ?? FileAudio;
}

export function statusIcon(status: AlbumStatus): LucideIcon {
  return STATUS_ICONS[status] ?? Library;
}
