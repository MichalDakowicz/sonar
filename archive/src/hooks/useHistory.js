import { useEffect, useState } from "react";
import { ref, onValue, push, set, update, query, orderByKey, limitToLast, remove, get, orderByChild, equalTo } from "firebase/database";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../components/ui/Toast";

export function useHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
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
      if (snapshot.exists()) {
        const loadedHistory = [];
        snapshot.forEach((childSnapshot) => {
            loadedHistory.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        // Reverse to show newest first
        setHistory(loadedHistory.reverse());
      } else {
        setHistory([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const removeHistoryItem = async (historyId) => {
    if (!user) return;
    try {
      console.log(`[useHistory] Removing item: ${historyId}`);
      
      // 1. Get the item to know which album it belongs to
      const historyItemRef = ref(db, `users/${user.uid}/history/${historyId}`);
      const snapshot = await get(historyItemRef);
      
      if (!snapshot.exists()) {
          console.warn("[useHistory] Item not found, maybe already deleted?");
          return;
      }
      
      const { albumId } = snapshot.val();

      // 2. Remove the history item
      await remove(historyItemRef);

      // Optimistic update for the history list
      setHistory(prev => prev.filter(item => item.id !== historyId));

      // 3. Find the NEW latest history entry for this album to update the album card
      // We fetch all history for this album to be 100% sure we find the latest one correctly
      const allHistoryRef = ref(db, `users/${user.uid}/history`);
      const q = query(allHistoryRef, orderByChild("albumId"), equalTo(albumId));
      
      const historySnapshot = await get(q);
      const albumRef = ref(db, `users/${user.uid}/albums/${albumId}`);

      if (historySnapshot.exists()) {
          // Found remaining history items
          const historyItems = [];
          historySnapshot.forEach(c => {
             historyItems.push(c.val());
          });
          
          // Sort by timestamp descending
          historyItems.sort((a, b) => b.timestamp - a.timestamp);
          
          const latest = historyItems[0];
          if (latest && latest.timestamp) {
              await update(albumRef, { lastListened: latest.timestamp });
              console.log(`[useHistory] Reverted album ${albumId} lastListened to ${latest.timestamp}`);
          }
      } else {
          // No history left for this album, remove lastListened
          await update(albumRef, { lastListened: null });
          console.log(`[useHistory] Removed lastListened from album ${albumId}`);
      }

      toast({
        title: "Success",
        description: "Removed spin from history and updated album.",
      });
    } catch (e) {
      console.error("[useHistory] Remove failed:", e);
      toast({
        title: "Error",
        description: "Failed to remove spin.",
        variant: "destructive"
      });
    }
  };

  return { history, loading, removeHistoryItem };
}

export function useLogListen() {
  const { user } = useAuth();
  const { toast } = useToast();

  const logListen = async (album) => {
    if (!user) return;
    
    try {
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

        toast({
            title: "Spin Logged",
            description: `Listened to ${album.title}`,
        });
    } catch (error) {
        console.error("Failed to log listen:", error);
        toast({
            title: "Error",
            description: "Could not log listen. Please check your connection.",
            variant: "destructive"
        });
    }
  };

  return { logListen };

}
