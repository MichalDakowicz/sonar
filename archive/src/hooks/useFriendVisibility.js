import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";

// Global cache to prevent flickering on navigation
const visibilityCache = new Map();

export function useFriendVisibility(userId) {
  // Initialize with cached value if available
  const cached = visibilityCache.get(userId);
  const [showFriends, setShowFriends] = useState(cached !== undefined ? cached : false);
  const [loading, setLoading] = useState(cached === undefined);

  useEffect(() => {
    if (!userId) {
      setShowFriends(false);
      setLoading(false);
      return;
    }

    const privacyRef = ref(db, `users/${userId}/settings/privacy/friendsVisibility`);
    const unsubscribe = onValue(privacyRef, (snapshot) => {
      const visibility = snapshot.val() || "friends"; // Default to friends if not set
      const isVisible = visibility !== "noone";
      
      visibilityCache.set(userId, isVisible);
      setShowFriends(isVisible);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { showFriends, loading };
}
