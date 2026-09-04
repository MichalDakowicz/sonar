import { Image } from 'expo-image';
import { Disc3 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

type CoverImageProps = {
  uri: string | null;
  /** Wishlist and pre-order covers are dimmed — you do not have it yet. */
  dimmed?: boolean;
  /** Crossfade length. 0 for rapid source swaps (the random-pick reel). */
  transitionMs?: number;
  /** Icon size for the no-artwork fallback. */
  iconSize?: number;
};

/**
 * Album artwork, or the record fallback when a release has none. Absolutely
 * positioned so every caller controls the aspect box itself — covers are square
 * in a grid but get cropped to 16:9 in a featured banner.
 */
export function CoverImage({ uri, dimmed, transitionMs = 200, iconSize = 32 }: CoverImageProps) {
  if (!uri) {
    return (
      <View className="absolute inset-0 items-center justify-center bg-neutral-800">
        <Disc3 size={iconSize} color="#52525b" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[StyleSheet.absoluteFill, { opacity: dimmed ? 0.65 : 1 }]}
      contentFit="cover"
      transition={transitionMs}
      // Keep covers in the memory cache (not just disk) so scrolling back up is
      // instant, and key the image by uri so FlashList cell recycling swaps the
      // source cleanly instead of flashing the previous cover during reuse.
      cachePolicy="memory-disk"
      recyclingKey={uri}
    />
  );
}
