import { Link } from "react-router-dom";
import { useUserProfile } from "../../hooks/useUserProfile";
import { User, ExternalLink, UserMinus } from "lucide-react";

export default function FriendCard({ uid, onRemove }) {
    const { profile, loading } = useUserProfile(uid);

    if (loading) {
        return (
            <div className="flex items-center p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl animate-pulse">
                <div className="w-12 h-12 bg-neutral-800 rounded-full mr-4" />
                <div className="flex-1">
                    <div className="h-4 w-32 bg-neutral-800 rounded mb-2" />
                </div>
            </div>
        );
    }

    const name = profile?.displayName || profile?.username || "Unknown User";
    const username = profile?.username ? `@${profile.username}` : "";
    const displayPfp = profile?.pfp;

    return (
        <div className="flex items-center justify-between p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors">
            <div className="flex items-center gap-4">
                {displayPfp ? (
                    <img 
                        src={displayPfp} 
                        alt={name} 
                        className="w-12 h-12 rounded-full object-cover border border-neutral-700"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                        <User size={20} />
                    </div>
                )}
                
                <div>
                    <h3 className="font-bold text-white text-lg">{name}</h3>
                    {username && <p className="text-xs text-neutral-500">{username}</p>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Link 
                    to={`/u/${uid}`} 
                    className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="View Shelf"
                >
                    <ExternalLink size={20} />
                </Link>
                {onRemove && (
                    <button 
                        onClick={() => onRemove(uid)}
                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                        title="Remove Friend"
                    >
                        <UserMinus size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}
