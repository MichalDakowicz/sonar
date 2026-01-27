import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";

export function usePublicAlbums(userId) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setAlbums([]);
      setLoading(false);
      return;
    }

    const albumsRef = ref(db, `users/${userId}/albums`);
    const unsubscribe = onValue(albumsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedAlbums = Object.entries(data)
          .map(([key, value]) => ({
            id: key,
            ...value,
          }))
          .filter(album => album.title); // basic validation
        // Sort by addedAt desc by default
        loadedAlbums.sort((a, b) => b.addedAt - a.addedAt);
        setAlbums(loadedAlbums);
      } else {
        setAlbums([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching public data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { albums, loading };
}
