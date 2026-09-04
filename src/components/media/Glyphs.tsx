import { CassetteTape, Clock, Disc, Disc3, FileAudio, Heart, Library } from 'lucide-react-native';

import type { AlbumStatus, Format } from '@/types/album';

/**
 * The picture for a format and for a shelf status.
 *
 * Written as components with a branch per case rather than as a lookup table
 * returning a component: a `const Icon = iconFor(x)` reference is a component
 * identity minted during render, which resets any state it holds and is exactly
 * what the react-hooks static-components rule objects to. Each branch below
 * returns fixed JSX instead.
 *
 * They live here, not in lib/formats or lib/albumStatus, so those stay free of
 * React and remain testable without a renderer.
 */
type GlyphProps = { size?: number; color: string };

export function FormatGlyph({ format, size = 12, color }: GlyphProps & { format: Format | string }) {
  switch (format) {
    case 'Vinyl':
      return <Disc size={size} color={color} />;
    case 'CD':
      return <Disc3 size={size} color={color} />;
    case 'Cassette':
      return <CassetteTape size={size} color={color} />;
    default:
      return <FileAudio size={size} color={color} />;
  }
}

export function StatusGlyph({
  status,
  size = 13,
  color,
  filled,
}: GlyphProps & { status: AlbumStatus; filled?: boolean }) {
  switch (status) {
    case 'Wishlist':
      // Filled, because a heart outline reads as "not yet liked" — the opposite
      // of what a wishlist badge means.
      return <Heart size={size} color={color} fill={filled ? color : 'transparent'} />;
    case 'Pre-order':
      return <Clock size={size} color={color} />;
    default:
      return <Library size={size} color={color} />;
  }
}
