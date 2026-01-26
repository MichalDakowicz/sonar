import { useEffect, useState } from "react";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthContext";

export function useAlbums() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAlbums([]);
      setLoading(false);
      return;
    }

    const albumsRef = ref(db, `users/${user.uid}/albums`);
    const unsubscribe = onValue(albumsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedAlbums = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        // Sort by addedAt desc by default
        loadedAlbums.sort((a, b) => b.addedAt - a.addedAt);
        setAlbums(loadedAlbums);
      } else {
        setAlbums([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addAlbum = async (albumData) => {
    if (!user) return;
    const albumsRef = ref(db, `users/${user.uid}/albums`);
    const newAlbumRef = push(albumsRef);
    await set(newAlbumRef, {
      ...albumData,
      addedAt: Date.now(),
    });
  };

  const updateAlbum = async (albumId, updates) => {
    if (!user) return;
    const albumRef = ref(db, `users/${user.uid}/albums/${albumId}`);
    await update(albumRef, updates);
  };

  const removeAlbum = async (albumId) => {
    if (!user) return;
    const albumRef = ref(db, `users/${user.uid}/albums/${albumId}`);
    await remove(albumRef);
  };

  return { albums, loading, addAlbum, updateAlbum, removeAlbum };
}
