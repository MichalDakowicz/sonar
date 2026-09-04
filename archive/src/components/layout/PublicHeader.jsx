import { Link, useParams } from "react-router-dom";
import { LayoutGrid, BarChart3, Users, Home as HomeIcon, LogOut, LogIn } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useFriendVisibility } from "../../hooks/useFriendVisibility";
import Logo from "../ui/Logo";

export function PublicHeader() {
    const { userId } = useParams();
    const { user, login, logout } = useAuth();
    const { profile, loading: profileLoading } = useUserProfile(userId);
    const { showFriends } = useFriendVisibility(userId);

    const isMe = user?.uid === userId;

    return (
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
                                            Public Shelf
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
                            title="Stats"
                        >
                            <BarChart3 size={20} />
                        </Link>
                        {showFriends && (
                            <Link
                                to={`/u/${userId}/friends`}
                                className="p-2 rounded-md transition-colors text-neutral-400 hover:text-white hover:bg-neutral-800"
                                title="Friends"
                            >
                                <Users size={20} />
                            </Link>
                        )}
                        <div className="h-6 w-px bg-neutral-800 mx-2" />
                    </div>
                    {user ? (
                        <>
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
                        </>
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
    );
}
