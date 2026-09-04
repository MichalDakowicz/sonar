import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuth } from "../features/auth/AuthContext";
import { ref, get, child } from "firebase/database";
import { db } from "../lib/firebase";
import { Loader2, Lock, LayoutGrid, BarChart3, Users, Home as HomeIcon, LogOut, LogIn } from "lucide-react";
import FriendCard from "../features/friends/FriendCard";
import { PublicBottomNav } from "../components/layout/PublicBottomNav";
import { PublicHeader } from "../components/layout/PublicHeader";

export default function PublicFriends() {
    const { userId } = useParams();
    const { profile, loading: profileLoading } = useUserProfile(userId);
    const { user: currentUser, login, logout } = useAuth();
    
    // Friends list state
    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [error, setError] = useState(null); // 'private' | 'generic'

    // Fetch friends respecting privacy
    useEffect(() => {
        const fetchFriends = async () => {
            setLoadingFriends(true);
            setError(null);
            try {
                // If viewing own, always allow
                // If viewing other, check DB
                // The DB rule should handle permission, but we can also check client side to be nice
                // We'll trust the DB rule primarily
                const friendsRef = ref(db, `users/${userId}/friends`);
                const snapshot = await get(friendsRef);
                
                if (snapshot.exists()) {
                    const friendIds = Object.keys(snapshot.val());
                    setFriends(friendIds);
                } else {
                    setFriends([]);
                }
            } catch (err) {
                // Firebase throws permission denied if we can't read
                if (err.message.includes("permission_denied") || err.code === "PERMISSION_DENIED") {
                    setError('private');
                } else {
                    console.error(err);
                    setError('generic');
                }
            } finally {
                setLoadingFriends(false);
            }
        };

        if (userId) {
            fetchFriends();
        }
    }, [userId, currentUser]);


    if (profileLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-emerald-500">
                <Loader2 size={48} className="animate-spin" />
            </div>
        );
    }

    const isMe = currentUser?.uid === userId;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200">
             <PublicHeader />

            <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
                {loadingFriends ? (
                     <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                     </div>
                ) : error === 'private' ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                        <div className="p-4 bg-neutral-900 rounded-full mb-4">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Friends List Private</h2>
                        <p>Only friends can view this user's connections.</p>
                    </div>
                ) : error ? (
                     <div className="text-center py-20 text-red-400">
                        Failed to load friends list.
                     </div>
                ) : friends.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                        No friends yet.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {friends.map(uid => (
                            <FriendCard key={uid} uid={uid} onRemove={null} />
                        ))}
                    </div>
                )}
            </main>
            <PublicBottomNav />
        </div>
    );
}
