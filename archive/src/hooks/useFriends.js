import { useState, useEffect } from "react";
import { ref, onValue, set, remove, get, update } from "firebase/database";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthContext";

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setRequests([]);
      setLoading(false);
      return;
    }

    const friendsRef = ref(db, `users/${user.uid}/friends`);
    const requestsRef = ref(db, `users/${user.uid}/friendRequests`);

    const unsubFriends = onValue(friendsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array of UIDs
        setFriends(Object.keys(data));
      } else {
        setFriends([]);
      }
    });

    const unsubRequests = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array of { uid, ...data }
        const reqs = Object.entries(data).map(([uid, info]) => ({
          uid,
          ...info,
        }));
        setRequests(reqs);
      } else {
        setRequests([]);
      }
      setLoading(false);
    });

    return () => {
      unsubFriends();
      unsubRequests();
    };
  }, [user]);

  const sendRequest = async (targetUid) => {
    if (!user) return;
    if (targetUid === user.uid) throw new Error("You cannot friend yourself.");
    
    // Check if already friends
    if (friends.includes(targetUid)) throw new Error("Already friends.");

    const reqRef = ref(db, `users/${targetUid}/friendRequests/${user.uid}`);
    
    // We only write basic info or just existence. 
    // The recipient can fetch our profile using our UID.
    await set(reqRef, {
      timestamp: Date.now(),
      status: 'pending'
    });
  };

  const acceptRequest = async (senderUid) => {
    if (!user) return;
    
    const updates = {};
    // Add to my friends
    updates[`users/${user.uid}/friends/${senderUid}`] = true;
    // Add me to their friends (Mutual)
    updates[`users/${senderUid}/friends/${user.uid}`] = true;
    // Remove request
    updates[`users/${user.uid}/friendRequests/${senderUid}`] = null;

    // Perform atomic update
    await update(ref(db), updates);
  };

  const rejectRequest = async (senderUid) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/friendRequests/${senderUid}`));
  };

  const removeFriend = async (friendUid) => {
    if (!user) return;
    
    // Remove from both sides
    const updates = {};
    updates[`users/${user.uid}/friends/${friendUid}`] = null;
    updates[`users/${friendUid}/friends/${user.uid}`] = null;

    await update(ref(db), updates);
  };

  return {
    friends,
    requests,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend
  };
}
