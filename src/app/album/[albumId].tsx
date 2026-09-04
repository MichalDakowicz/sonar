import { useLocalSearchParams } from 'expo-router';

import { AlbumDetailScreen } from '@/features/albums/detail/AlbumDetailScreen';

/**
 * A record on your shelf, resolved by row id (not by release key) so a
 * hand-typed album with no Spotify match still opens correctly. Renders the
 * same shared screen as /release/[albumKey].
 */
export default function AlbumRoute() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  return <AlbumDetailScreen albumId={albumId} />;
}
