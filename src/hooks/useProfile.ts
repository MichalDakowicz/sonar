import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/album';

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  pfp: string | null;
  created_at: string;
};

// public.profiles is the shared identity table: the same row backs your Radar
// profile and your Sonar one, so editing your username here renames you there
// too. That is the point of running both apps on one project.
//
// Radar's `favorites` column (its pinned top 4) is deliberately not selected or
// written here — it is capped at four entries, so album picks would overwrite
// the films pinned in the other app. Sonar's shelf leads with top-rated
// releases instead, which it derives.
export function normalizeProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    pfp: row.pfp,
    createdAt: row.created_at,
  };
}

const COLUMNS = 'id, username, display_name, pfp, created_at';

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? normalizeProfile(data as ProfileRow) : null;
}

export async function fetchProfiles(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('profiles').select(COLUMNS).in('id', ids);
  if (error) throw error;
  return (data as ProfileRow[]).map(normalizeProfile);
}

// profiles is world-readable (profiles_read using(true)), so one row fetch
// works for own + friend + stranger profiles alike. Cached long, since
// usernames and avatars rarely change within a session.
export function useProfile(id: string | undefined) {
  const query = useQuery({
    queryKey: ['profile', id],
    queryFn: () => fetchProfile(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
  return { profile: query.data ?? null, loading: query.isLoading, error: query.error };
}

/**
 * Several profiles at once, as a lookup. For lists that name people you do not
 * own — the inbox, the feed — one `in` query beats one useProfile per row.
 * Keyed on the sorted id set, so a reordered list is not a new cache entry.
 */
export function useProfileMap(ids: string[]): Map<string, Profile> {
  const unique = [...new Set(ids.filter(Boolean))].sort();
  const query = useQuery({
    queryKey: ['profiles', unique.join(',')],
    queryFn: () => fetchProfiles(unique),
    enabled: unique.length > 0,
    staleTime: 5 * 60 * 1000,
  });
  return useMemo(() => new Map((query.data ?? []).map((profile) => [profile.id, profile])), [query.data]);
}

export type ProfileUpdate = {
  username: string;
  displayName: string;
  pfp: string; // data URI, or empty string to clear
};

// Edits the signed-in user's own row (profiles_update RLS: id = auth.uid()).
// username is unique in the schema, so a clash is surfaced as a friendly error
// before the write.
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, displayName, pfp }: ProfileUpdate) => {
      if (!user) throw new Error('Not signed in');
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) throw new Error('Username is required.');
      if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        throw new Error('Username may only contain lowercase letters, numbers, and underscores.');
      }

      const { data: taken, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', user.id)
        .maybeSingle();
      if (checkError) throw checkError;
      if (taken) throw new Error('Username already taken.');

      const { error } = await supabase
        .from('profiles')
        .update({ username: cleanUsername, display_name: displayName.trim() || null, pfp: pfp.trim() || null })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    },
  });
}
