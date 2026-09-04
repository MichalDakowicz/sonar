import { useState } from "react";
import { Navbar } from "../components/layout/Navbar";
import { useFriends } from "../hooks/useFriends";
import FriendCard from "../features/friends/FriendCard";
import FriendRequestItem from "../features/friends/FriendRequestItem";
import UserSearch from "../features/friends/UserSearch";
import { Users, UserPlus, Inbox, Loader2 } from "lucide-react";

export default function Friends() {
    const { friends, requests, loading, sendRequest, acceptRequest, rejectRequest, removeFriend } = useFriends();
    const [activeTab, setActiveTab] = useState("list"); // 'list' | 'search'

    return (
        <div className="min-h-screen bg-neutral-950 text-white pb-20">
            <Navbar />
            
            <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-8 space-y-8">

                {/* Tabs */}
                <div className="flex p-1 bg-neutral-900 rounded-lg w-full max-w-md mx-auto sm:mx-0">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === "list" 
                                ? "bg-neutral-800 text-white shadow-sm" 
                                : "text-neutral-400 hover:text-white"
                        }`}
                    >
                        <Users size={16} />
                        My Friends ({friends.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("search")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === "search" 
                                ? "bg-neutral-800 text-white shadow-sm" 
                                : "text-neutral-400 hover:text-white"
                        }`}
                    >
                        <UserPlus size={16} />
                        Find Friends
                    </button>
                </div>

                {/* Requests Section - Always visible if there are requests */}
                {requests.length > 0 && (
                    <div className="bg-neutral-900/30 border border-emerald-900/30 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-emerald-900/30 bg-emerald-900/10 flex items-center gap-2">
                             <Inbox className="w-5 h-5 text-emerald-500" />
                             <h2 className="font-semibold text-emerald-100">Friend Requests</h2>
                             <span className="ml-auto bg-emerald-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                                {requests.length}
                             </span>
                        </div>
                        <div className="p-4 space-y-3">
                            {requests.map(req => (
                                <FriendRequestItem 
                                    key={req.uid} 
                                    uid={req.uid} 
                                    onAccept={acceptRequest}
                                    onReject={rejectRequest} 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="space-y-6">
                    {activeTab === "list" && (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500">
                                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">You haven't followed anyone yet.</p>
                                    <p className="text-sm mt-2">Find friends to see their collection!</p>
                                    <button 
                                        onClick={() => setActiveTab("search")}
                                        className="mt-4 text-emerald-500 font-medium hover:underline"
                                    >
                                        Find people
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {friends.map(uid => (
                                        <FriendCard 
                                            key={uid} 
                                            uid={uid} 
                                            onRemove={removeFriend} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "search" && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-semibold mb-4">Add by Username</h2>
                            <UserSearch 
                                currentFriends={friends} 
                                onSendRequest={sendRequest} 
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
