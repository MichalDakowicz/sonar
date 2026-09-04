import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";

// Global cache to persist data across component remounts
const globalPublicAlbumsCache = new Map();

export function usePublicAlbums(userId) {
  // Initialize from cache if available
  const [albums, setAlbums] = useState(() => {
     return globalPublicAlbumsCache.get(userId) || [];
  });
  
  // Only start loading if we didn't have data in cache
  const [loading, setLoading] = useState(() => {
      return !globalPublicAlbumsCache.has(userId);
  });

  useEffect(() => {
    if (!userId) {
      setAlbums([]);
      setLoading(false);
      return;
    }

    const albumsRef = ref(db, `users/${userId}/albums`);
    const unsubscribe = onValue(albumsRef, (snapshot) => {
      const data = snapshot.val();
      let loadedAlbums = [];
      if (data) {
        loadedAlbums = Object.entries(data)
          .map(([key, value]) => ({
            id: key,
            ...value,
          }))
          .filter(album => album.title); // basic validation
        // Sort by addedAt desc by default
        loadedAlbums.sort((a, b) => b.addedAt - a.addedAt);
      }
      
      // Update cache
      globalPublicAlbumsCache.set(userId, loadedAlbums);
      
      setAlbums(loadedAlbums);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching public data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { albums, loading };
}
