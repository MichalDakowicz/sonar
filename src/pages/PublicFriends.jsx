import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuth } from "../features/auth/AuthContext";
import { ref, get, child } from "firebase/database";
import { db } from "../lib/firebase";
import { Loader2, Lock, LayoutGrid, BarChart3, Users, Home as HomeIcon, LogOut, LogIn } from "lucide-react";
import FriendCard from "../features/friends/FriendCard";
import Logo from "../components/ui/Logo";

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
             <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4">
                <div className="mx-auto max-w-screen-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {profileLoading ? (
                            <div className="flex items-center gap-3 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-neutral-800" />
                                <div className="flex flex-col gap-1">
                                    <div className="h-4 w-32 bg-neutral-800 rounded" />
                                    <div className="h-3 w-20 bg-neutral-800 rounded" />
                                </div>
                            </div>
                        ) : (
                            <>
                                {profile?.pfp ? (
                                    <img
                                        src={profile.pfp}
                                        alt="Profile"
                                        className="h-10 w-10 rounded-full object-cover border-2 border-emerald-500/20"
                                    />
                                ) : (
                                    <Logo className="h-8 w-8 text-emerald-500" />
                                )}

                                <div className="flex flex-col justify-center">
                                    {profile?.username ? (
                                        <>
                                            <h1 className="text-lg font-bold text-white leading-tight">
                                                {profile.displayName || profile.username}
                                            </h1>
                                            {profile.displayName && (
                                                <div className="text-xs font-medium text-neutral-500">
                                                    @{profile.username}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                                Sonar
                                            </h1>
                                            <div className="h-6 w-px bg-neutral-800" />
                                            <span className="text-emerald-500 font-medium">
                                                Public
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden min-[780px]:flex items-center gap-1 mr-2">
                            <Link
                                to={`/u/${userId}`}
                                className="p-2 rounded-md transition-colors text-neutral-400 hover:text-white hover:bg-neutral-800"
                                title="Library"
                            >
                                <LayoutGrid size={20} />
                            </Link>

                            <Link
                                to={`/u/${userId}/stats`}
                                className="p-2 rounded-md transition-colors text-neutral-400 hover:text-white hover:bg-neutral-800"
                                title="Insights"
                            >
                                <BarChart3 size={20} />
                            </Link>

                             <div className="p-2 rounded-md text-white bg-neutral-800 cursor-default" title="Friends">
                                <Users size={20} />
                            </div>
                             <div className="h-6 w-px bg-neutral-800 mx-2" />
                        </div>
                        {currentUser ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/"
                                    className="flex items-center gap-2 rounded-full border border-neutral-700 px-3 py-2 sm:px-4 text-sm font-medium hover:bg-neutral-800 hover:text-emerald-400 transition-colors"
                                >
                                    <HomeIcon size={16} />
                                    <span className="hidden sm:inline">
                                        My Collection
                                    </span>
                                </Link>

                                <button
                                    onClick={logout}
                                    className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                                    title="Logout"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={login}
                                className="flex items-center gap-2 rounded-full bg-white px-3 py-2 sm:px-4 text-sm font-bold text-black hover:bg-neutral-200 transition-colors"
                            >
                                <LogIn size={16} />
                                <span className="hidden sm:inline">Login</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

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
             <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-lg min-[780px]:hidden pb-safe">
                <div className="flex items-center justify-around p-2">
                    <Link
                        to={`/u/${userId}`}
                        className="flex flex-col items-center gap-1 p-2 text-neutral-500"
                    >
                        <LayoutGrid size={24} />
                        <span className="text-[10px] font-medium">Library</span>
                    </Link>
                    <Link
                        to={`/u/${userId}/stats`}
                        className="flex flex-col items-center gap-1 p-2 text-neutral-500"
                    >
                        <BarChart3 size={24} />
                        <span className="text-[10px] font-medium">Stats</span>
                    </Link>
                     <div className="flex flex-col items-center gap-1 p-2 text-emerald-500">
                        <Users size={24} />
                        <span className="text-[10px] font-medium">Friends</span>
                    </div>
                </div>
            </nav>
        </div>
    );
}
