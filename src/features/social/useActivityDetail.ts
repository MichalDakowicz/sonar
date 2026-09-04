import { useQuery } from '@tanstack/react-query';

import { useAlbumRatings } from '@/hooks/useAlbumRatings';
import { useAlbums } from '@/hooks/useAlbums';
import { supabase } from '@/lib/supabase';
import type { AlbumActivityEvent, AlbumActivityType } from '@/types/album';

type ActivityRow = {
  id: string;
  user_id: string;
  album_id: string | null;
  album_key: string | null;
  album_title: string;
  type: AlbumActivityType;
  details: Record<string, unknown> | null;
  created_at: string;
};

/**
 * One activity row, fetched by id rather than found in the feed's page: the
 * thread is a deep-linkable route, so it has to stand up when the feed was
 * never loaded (a shared URL, a cold start).
 *
 * The artwork is looked up locally by release key — an activity row only stores
 * a title, because it has to survive the album being deleted.
 */
export function useActivityDetail(activityId: string | undefined) {
  const { albums } = useAlbums();
  const { ratings } = useAlbumRatings();

  const query = useQuery({
    queryKey: ['albumActivity', 'one', activityId],
    queryFn: async (): Promise<AlbumActivityEvent | null> => {
      const { data, error } = await supabase.from('album_activity').select('*').eq('id', activityId!).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as ActivityRow;
      return {
        id: row.id,
        userId: row.user_id,
        albumId: row.album_id,
        albumKey: row.album_key,
        albumTitle: row.album_title,
        type: row.type,
        details: row.details ?? {},
        createdAt: row.created_at,
      };
    },
    enabled: !!activityId,
  });

  const event = query.data ?? null;
  const key = event?.albumKey;
  const coverUrl =
    (key ? albums.find((album) => album.albumKey === key)?.coverUrl : null) ??
    (key ? ratings.find((rating) => rating.albumKey === key)?.coverUrl : null) ??
    null;

  return { event, coverUrl, loading: query.isLoading, error: query.error };
}
