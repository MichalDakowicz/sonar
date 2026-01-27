import { useEffect, useState } from "react";
import { ref, onValue, push, set, update, query, orderByKey, limitToLast } from "firebase/database";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthContext";

export function useHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const historyRef = query(
        ref(db, `users/${user.uid}/history`),
        orderByKey(), // Firebase Push IDs are chronologically sorted
        limitToLast(50) // Only get the last 50 listens
    );

    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert to array and reverse (newest first)
        const loadedHistory = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        })).reverse();
        setHistory(loadedHistory);
      } else {
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { history, loading };
}

export function useLogListen() {
  const { user } = useAuth();

  const logListen = async (album) => {
    if (!user) return;
    
    const timestamp = Date.now();
    
    // 1. Add to history
    const historyRef = ref(db, `users/${user.uid}/history`);
    const newHistoryRef = push(historyRef);
    await set(newHistoryRef, {
      albumId: album.id,
      title: album.title,
      artist: album.artist,
      coverUrl: album.coverUrl || null,
      timestamp: timestamp
    });

    // 2. Update album's lastListened
    const albumRef = ref(db, `users/${user.uid}/albums/${album.id}`);
    await update(albumRef, {
      lastListened: timestamp
    });
  };

  return { logListen };

}
