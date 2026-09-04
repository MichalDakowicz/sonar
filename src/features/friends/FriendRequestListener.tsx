import { useEffect, useRef } from 'react';

import { useToast } from '@/components/ui/Toast';
import { useFriends } from '@/hooks/useFriends';

// Global realtime toast on a new incoming friend request (ported from legacy
// FriendRequestListener). useFriends already subscribes to friend_requests
// realtime; this just diffs the list and toasts arrivals after first load.
// Renders nothing.
export function FriendRequestListener() {
  const { requests, loading } = useFriends();
  const { show } = useToast();
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (loading) return;
    const currentIds = requests.map((r) => r.profile.id);

    // First resolved load: memorize, don't toast the backlog.
    if (seenRef.current === null) {
      seenRef.current = new Set(currentIds);
      return;
    }

    for (const req of requests) {
      if (!seenRef.current.has(req.profile.id)) {
        const name = req.profile.displayName || req.profile.username;
        show(`${name} sent you a friend request`);
      }
    }
    seenRef.current = new Set(currentIds);
  }, [requests, loading, show]);

  return null;
}
