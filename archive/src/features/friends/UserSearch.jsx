import { useState } from "react";
import { Search, UserPlus, Check, Loader2, AlertCircle } from "lucide-react";
import { ref, get, query, orderByKey, orderByChild, startAt, endAt, limitToFirst } from "firebase/database";
import { db } from "../../lib/firebase";
import { useAuth } from "../auth/AuthContext";
import { useUserProfile } from "../../hooks/useUserProfile";

function SearchResultItem({ uid, username, currentFriends, onSendRequest }) {
    const { profile } = useUserProfile(uid);
    const { user } = useAuth();
    const [status, setStatus] = useState("idle");

    if (!profile) return (
        <div className="p-3 mb-2 bg-neutral-900 rounded-lg flex items-center gap-3 border border-neutral-800 animate-pulse">
             <div className="w-10 h-10 rounded-full bg-neutral-800"/>
             <div className="h-4 w-24 bg-neutral-800 rounded"/>
        </div>
    );

    const isMe = uid === user.uid;
    const isFriend = currentFriends.includes(uid);
    
    const handleAdd = async () => {
        if (status === 'sending') return;
        setStatus('sending');
        try {
            await onSendRequest(uid);
            setStatus('sent');
        } catch (e) {
            console.error(e);
            setStatus('idle');
        }
    };

    return (
        <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg group hover:border-emerald-500/50 transition-colors mb-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700 relative">
                    {profile.pfp ? (
                        <img src={profile.pfp} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-medium bg-neutral-900">
                           {profile.username?.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{profile.displayName || profile.username}</span>
                    <span className="text-xs text-neutral-500">@{profile.username}</span>
                </div>
            </div>

            <div className="flex gap-2">
                 {isMe ? (
                     <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded flex items-center">You</span>
                 ) : isFriend ? (
                     <span className="text-xs text-emerald-500 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50 flex items-center gap-1">
                        <Check size={12} />
                        Friend
                     </span>
                 ) : status === 'sent' ? (
                     <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-1 rounded flex items-center gap-1">
                        <Check size={12} />
                     </span>
                 ) : (
                    <button 
                        onClick={handleAdd}
                        disabled={status === 'sending'}
                        className="p-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-md transition-colors"
                        title="Add Friend"
                    >
                        {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    </button>
                 )}
            </div>
        </div>
    );
}

export default function UserSearch({ currentFriends, onSendRequest }) {
    const [queryText, setQueryText] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        const term = queryText.trim();
        if (!term) return;

        setLoading(true);
        setResults([]);
        setHasSearched(true);
        
        try {
            const searchRef = ref(db, 'userSearchIndex');
            
            // Parallel queries for Username and Display Name
            const qUsername = query(searchRef, orderByChild('username'), startAt(term), endAt(term + "\uf8ff"), limitToFirst(10));
            const qDisplayName = query(searchRef, orderByChild('displayName'), startAt(term), endAt(term + "\uf8ff"), limitToFirst(10));

            const [snapUsername, snapDisplayName] = await Promise.all([
                get(qUsername),
                get(qDisplayName)
            ]);

            const foundMap = new Map();
            
            const processSnapshot = (snap) => {
                if (snap.exists()) {
                    snap.forEach((child) => {
                        const uid = child.key;
                        const data = child.val();
                        if (!foundMap.has(uid)) {
                            foundMap.set(uid, {
                                uid,
                                username: data.username,
                                displayName: data.displayName
                            });
                        }
                    });
                }
            };

            processSnapshot(snapUsername);
            processSnapshot(snapDisplayName);

            // Fallback for key-only username search (legacy or if index hasn't caught up)
            // But if userSearchIndex is empty, we find nothing. That matches lazy migration expectation.
            
            setResults(Array.from(foundMap.values()));

        } catch (err) {
            console.error("Search error", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-neutral-500" size={18} />
                    <input 
                        type="text" 
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        placeholder="Search by username..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>
                <button 
                    type="submit"
                    disabled={loading || !queryText.trim()}
                    className="bg-neutral-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Find"}
                </button>
            </form>

            <div className="min-h-25">
                {loading ? (
                   <div className="text-center text-neutral-500 py-4">Searching...</div>
                ) : results.length > 0 ? (
                    <div>
                        {results.map((res) => (
                            <SearchResultItem 
                                key={res.username} 
                                uid={res.uid} 
                                username={res.username}
                                currentFriends={currentFriends}
                                onSendRequest={onSendRequest}
                            />
                        ))}
                    </div>
                ) : hasSearched ? (
                    <div className="flex flex-col items-center justify-center py-6 text-neutral-500">
                        <AlertCircle size={32} className="mb-2 opacity-50" />
                        <p>No matches for "{queryText}"</p>
                    </div>
                ) : (
                     <div className="text-center text-neutral-600 py-8 text-sm">
                        Enter username to search...
                     </div>
                )}
            </div>
        </div>
    );
}
