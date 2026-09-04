import { Link, useLocation, useParams } from "react-router-dom";
import { LayoutGrid, BarChart3, Users } from "lucide-react";
import { useFriendVisibility } from "../../hooks/useFriendVisibility";

export function PublicBottomNav() {
    const { userId } = useParams();
    const location = useLocation();
    const { showFriends } = useFriendVisibility(userId);

    // Determine active page
    const isStats = location.pathname.endsWith('/stats');
    const isFriends = location.pathname.endsWith('/friends');
    const isLibrary = !isStats && !isFriends;

    if (!userId) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-lg min-[780px]:hidden pb-safe">
            <div className="flex items-center justify-around p-2">
                <Link
                    to={`/u/${userId}`}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        isLibrary ? "text-emerald-500" : "text-neutral-400 hover:text-emerald-500"
                    }`}
                >
                    <LayoutGrid size={24} />
                    <span className="text-[10px] font-medium">Library</span>
                </Link>

                <Link
                    to={`/u/${userId}/stats`}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        isStats ? "text-emerald-500" : "text-neutral-400 hover:text-emerald-500"
                    }`}
                >
                    <BarChart3 size={24} />
                    <span className="text-[10px] font-medium">Stats</span>
                </Link>

                {/* Show Friends link if allowed, OR if we are currently on the page (to avoid confusing disappearance) */}
                {(showFriends || isFriends) && (
                    <Link
                        to={`/u/${userId}/friends`}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                            isFriends ? "text-emerald-500" : "text-neutral-400 hover:text-emerald-500"
                        }`}
                    >
                        <Users size={24} />
                        <span className="text-[10px] font-medium">Friends</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
