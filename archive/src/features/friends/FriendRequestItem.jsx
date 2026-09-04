import { useUserProfile } from "../../hooks/useUserProfile";
import { User, Check, X } from "lucide-react";

export default function FriendRequestItem({ uid, onAccept, onReject }) {
    const { profile, loading } = useUserProfile(uid);

    if (loading) {
        return (
            <div className="flex items-center p-3 bg-neutral-900/30 border border-neutral-800 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-neutral-800 rounded-full mr-3" />
                <div className="flex-1 opacity-50">Loading...</div>
            </div>
        );
    }

    const name = profile?.displayName || profile?.username || "Unknown User";
    const username = profile?.username;
    const displayPfp = profile?.pfp;

    return (
        <div className="flex items-center justify-between p-3 bg-neutral-900/30 border border-neutral-800 rounded-lg">
           <div className="flex items-center gap-3">
                {displayPfp ? (
                    <img 
                        src={displayPfp} 
                        alt={name} 
                        className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                        <User size={18} />
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="font-medium text-neutral-200 text-sm">{name}</span>
                    {profile?.displayName && <span className="text-xs text-neutral-500">@{username}</span>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onAccept(uid)}
                    className="p-1.5 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-md transition-colors"
                >
                    <Check size={18} />
                </button>
                <button 
                    onClick={() => onReject(uid)}
                    className="p-1.5 bg-neutral-800 text-neutral-500 hover:bg-red-900/20 hover:text-red-400 rounded-md transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
