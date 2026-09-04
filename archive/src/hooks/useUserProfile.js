import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";

const profileCache = new Map();

export function useUserProfile(userId) {
  const cached = profileCache.has(userId) ? profileCache.get(userId) : undefined;
  const [profile, setProfile] = useState(cached || null);
  const [loading, setLoading] = useState(cached === undefined);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const profileRef = ref(db, `users/${userId}/profile`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      const data = snapshot.val();
      profileCache.set(userId, data);
      setProfile(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { profile, loading };
}
