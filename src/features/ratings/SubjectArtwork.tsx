import { Image } from 'expo-image';
import { Disc3, Music2, User } from 'lucide-react-native';
import { View } from 'react-native';

import { COLORS } from '@/theme/colors';
import type { RatingSubject } from '@/types/album';

type SubjectArtworkProps = {
  subject: RatingSubject;
  uri: string | null;
  size: number;
};

/**
 * Artwork for anything rateable, with the subject readable off the shape.
 *
 * An artist is a circle and a song is a rounded square with a note badge, so a
 * board holding all three does not read as one undifferentiated wall of album
 * covers — a song borrows its release's art, so without this a song and its
 * album are the same picture twice.
 */
export function SubjectArtwork({ subject, uri, size }: SubjectArtworkProps) {
  const round = subject === 'artist';
  const Fallback = subject === 'artist' ? User : subject === 'song' ? Music2 : Disc3;

  return (
    <View
      className="overflow-hidden bg-secondary"
      style={{ width: size, height: size, borderRadius: round ? size / 2 : Math.max(4, size * 0.11) }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={120} recyclingKey={uri} />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Fallback size={Math.round(size * 0.36)} color={COLORS.mutedDeep} />
        </View>
      )}

      {subject === 'song' && (
        <View
          className="absolute bottom-0 right-0 items-center justify-center bg-black/70"
          style={{ width: size * 0.36, height: size * 0.36, borderTopLeftRadius: size * 0.2 }}
        >
          <Music2 size={Math.round(size * 0.2)} color={COLORS.accent} />
        </View>
      )}
    </View>
  );
}
