import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';

import { fetchAlbumTracks, isSpotifyConfigured } from '@/lib/spotify';

function duration(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * The track listing, straight from Spotify and never stored: it is catalogue
 * data that would only go stale in our own table, and a release page without it
 * still works (nothing else depends on it loading).
 */
export function TrackList({ spotifyId }: { spotifyId: string | null }) {
  const query = useQuery({
    queryKey: ['spotifyTracks', spotifyId],
    queryFn: () => fetchAlbumTracks(spotifyId!),
    enabled: !!spotifyId && isSpotifyConfigured(),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const tracks = query.data ?? [];
  if (!spotifyId || tracks.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tracks</Text>
      <View className="overflow-hidden rounded-xl border border-border">
        {tracks.map((track, index) => (
          <View
            key={`${track.number}-${track.title}`}
            className="flex-row items-center gap-3 px-3 py-2.5"
            style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
          >
            <Text className="w-6 text-right text-xs text-muted-foreground">{track.number}</Text>
            <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-foreground">
              {track.title}
            </Text>
            <Text className="text-xs text-muted-foreground">{duration(track.durationMs)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
