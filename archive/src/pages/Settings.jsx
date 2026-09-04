import { useState, useEffect } from "react";
import { Navbar } from "../components/layout/Navbar";
import { useAuth } from "../features/auth/AuthContext";
import { useAlbums } from "../hooks/useAlbums";
import { useUserProfile } from "../hooks/useUserProfile";
import ImportExportModal from "../features/settings/ImportExportModal";
import LegacyImportModal from "../features/settings/LegacyImportModal";
import EditProfileModal from "../features/settings/EditProfileModal";
import { useToast } from "../components/ui/Toast";
import { LogOut, Database, Share2, User, ChevronRight, Settings as SettingsIcon, FileJson, Edit2, RotateCw, Globe, Users, Lock, Monitor, LayoutGrid } from "lucide-react";
import { ref, update, get, set } from "firebase/database";
import { db } from "../lib/firebase";

export default function Settings() {
    const { user, logout } = useAuth();
    const { profile } = useUserProfile(user?.uid);
    const { albums, addAlbum, removeAlbum } = useAlbums();
    const { toast } = useToast();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isLegacyImportModalOpen, setIsLegacyImportModalOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Privacy State
    const [friendsVisibility, setFriendsVisibility] = useState("friends"); // 'friends' | 'noone'
    const [loadingPrivacy, setLoadingPrivacy] = useState(true);

    // Appearance State
    const [gridSize, setGridSize] = useState(() => {
        try {
            const saved = localStorage.getItem("mt_gridSize");
            return saved ? JSON.parse(saved) : "normal";
        } catch (e) {
            return "normal";
        }
    });

    const handleGridSizeChange = (newSize) => {
        setGridSize(newSize);
        localStorage.setItem("mt_gridSize", JSON.stringify(newSize));
        toast({
            title: "Grid Size Updated",
            description: `Layout set to ${newSize} mode.`
        });
    };

    useEffect(() => {
        if (!user) return;
        const fetchPrivacy = async () => {
             const snap = await get(ref(db, `users/${user.uid}/settings/privacy`));
             if (snap.exists()) {
                 setFriendsVisibility(snap.val().friendsVisibility || "friends");
             }
             setLoadingPrivacy(false);
        };
        fetchPrivacy();
    }, [user]);
    
    const handlePrivacyChange = async (newVal) => {
        if (newVal === friendsVisibility) return;
        const oldVal = friendsVisibility;
        setFriendsVisibility(newVal);
        try {
            await set(ref(db, `users/${user.uid}/settings/privacy/friendsVisibility`), newVal);
             toast({
                title: "Privacy Updated",
                description: `Visibility set to: ${
                    newVal === 'public' ? 'Public' : newVal === 'friends' ? 'Friends Only' : 'Only Me'
                }`,
            });
        } catch (e) {
            console.error(e);
            setFriendsVisibility(oldVal); // Revert
             toast({
                title: "Update Failed",
                variant: 'destructive'
            });
        }
    };

    const displayPfp = profile?.pfp || user?.photoURL;
    const displayUsername = profile?.username || user?.displayName || 'User';

    const handleShareShelf = () => {
        if (!user) return;
        const url = `https://sonar-tracker.web.app/u/${user.uid}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied!",
            description: "Public shelf link copied to your clipboard.",
            variant: "default",
        });
    };

    const handleRepairSearch = async () => {
        if (!user || !profile) return;
        setRefreshing(true);
        try {
             const updates = {};
             // Update Search Index
             const indexData = {
                username: profile.username,
                displayName: profile.displayName || user.displayName || "User",
                pfp: profile.pfp || ""
             };
             updates[`userSearchIndex/${user.uid}`] = indexData;
             
             // Ensure username mapping is correct
             if (profile.username) {
                 updates[`usernames/${profile.username}`] = user.uid;
             }

             await update(ref(db), updates);
             toast({
                 title: "Search Index Repaired",
                 description: "Your profile should now be discoverable.",
             });
        } catch (e) {
            console.error(e);
            toast({
                 title: "Repair Failed",
                 description: e.message,
                 variant: "destructive"
            });
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white pb-20">
            <Navbar />
            
            <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6 pb-8">
                <EditProfileModal 
                    isOpen={isEditProfileOpen} 
                    onClose={() => setIsEditProfileOpen(false)} 
                />

               

                <div className="space-y-6">
                    {/* Account Section */}
                    <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-800">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-neutral-400" />
                                Account
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                {displayPfp ? (
                                    <img src={displayPfp} alt={displayUsername} className="w-16 h-16 rounded-full border-2 border-neutral-800 object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold text-neutral-400">
                                        {displayUsername?.[0] || '?'}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-lg">{displayUsername}</p>
                                    <p className="text-neutral-400 text-sm">{user?.email}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleRepairSearch}
                                disabled={refreshing}
                                className="w-full flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors border border-transparent mb-2 group"
                            >
                                <span className="flex items-center gap-3 font-medium text-neutral-200">
                                    <RotateCw className={`w-5 h-5 text-blue-500 ${refreshing ? "animate-spin" : ""}`} />
                                    Repair Account Visibility
                                </span>
                                <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400" />
                            </button>

                            <button
                                onClick={() => setIsEditProfileOpen(true)}
                                className="w-full flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors border border-transparent mb-2 group"
                            >
                                <span className="flex items-center gap-3 font-medium text-neutral-200">
                                    <Edit2 className="w-5 h-5 text-emerald-500" />
                                    Edit Profile
                                </span>
                                <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                            </button>
                            
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 hover:bg-red-900/20 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/50 group"
                            >
                                <span className="flex items-center gap-3 font-medium">
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </span>
                                <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </section>


                    {/* Privacy Section */}
                    <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-800">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Globe className="w-5 h-5 text-neutral-400" />
                                Privacy
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <h3 className="font-medium text-white">Friends List Visibility</h3>
                                <p className="text-sm text-neutral-400">Control who can see your friends on your public profile</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    onClick={() => handlePrivacyChange('noone')}
                                    disabled={loadingPrivacy}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                                        friendsVisibility === 'noone' 
                                        ? 'bg-red-900/20 border-red-500/50 text-white' 
                                        : 'bg-neutral-800/50 border-transparent text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                >
                                    <Lock className={`mb-2 w-6 h-6 ${friendsVisibility === 'noone' ? 'text-red-400' : ''}`} />
                                    <span className="font-medium">Only Me</span>
                                    <span className="text-xs opacity-70">Private</span>
                                </button>

                                <button
                                    onClick={() => handlePrivacyChange('friends')}
                                    disabled={loadingPrivacy}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                                        friendsVisibility === 'friends' 
                                        ? 'bg-emerald-900/20 border-emerald-500/50 text-white' 
                                        : 'bg-neutral-800/50 border-transparent text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                >
                                    <Users className={`mb-2 w-6 h-6 ${friendsVisibility === 'friends' ? 'text-emerald-400' : ''}`} />
                                    <span className="font-medium">Friends</span>
                                    <span className="text-xs opacity-70">Friends Only</span>
                                </button>

                                <button
                                    onClick={() => handlePrivacyChange('public')}
                                    disabled={loadingPrivacy}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                                        friendsVisibility === 'public' 
                                        ? 'bg-blue-900/20 border-blue-500/50 text-white' 
                                        : 'bg-neutral-800/50 border-transparent text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                >
                                    <Globe className={`mb-2 w-6 h-6 ${friendsVisibility === 'public' ? 'text-blue-400' : ''}`} />
                                    <span className="font-medium">Public</span>
                                    <span className="text-xs opacity-70">Anyone with link</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Appearance Section */}
                    <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-800">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-neutral-400" />
                                Appearance
                            </h2>
                        </div>
                        <div className="p-6">
                             <div className="mb-4">
                                <h3 className="font-medium text-white">Grid Size</h3>
                                <p className="text-sm text-neutral-400">Adjust the size of album cards in the grid view</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => handleGridSizeChange('compact')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                                        gridSize === 'compact' 
                                        ? 'bg-emerald-900/20 border-emerald-500/50 text-white' 
                                        : 'bg-neutral-800/50 border-transparent text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                >
                                    <LayoutGrid className={`mb-2 w-6 h-6 ${gridSize === 'compact' ? 'text-emerald-400' : ''} scale-75`} />
                                    <span className="font-medium">Compact</span>
                                </button>

                                <button
                                    onClick={() => handleGridSizeChange('normal')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                                        gridSize === 'normal' 
                                        ? 'bg-emerald-900/20 border-emerald-500/50 text-white' 
                                        : 'bg-neutral-800/50 border-transparent text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                >
                                    <LayoutGrid className={`mb-2 w-6 h-6 ${gridSize === 'normal' ? 'text-emerald-400' : ''}`} />
                                    <span className="font-medium">Normal</span>
                                </button>

                                <button
                                    onClick={() => handleGridSizeChange('large')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                                        gridSize === 'large' 
                                        ? 'bg-emerald-900/20 border-emerald-500/50 text-white' 
                                        : 'bg-neutral-800/50 border-transparent text-neutral-400 hover:bg-neutral-800'
                                    }`}
                                >
                                    <LayoutGrid className={`mb-2 w-6 h-6 ${gridSize === 'large' ? 'text-emerald-400' : ''} scale-125`} />
                                    <span className="font-medium">Large</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Content Section */}
                    <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                         <div className="px-6 py-4 border-b border-neutral-800">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Database className="w-5 h-5 text-neutral-400" />
                                Data & Privacy
                            </h2>
                        </div>
                        <div className="p-2">
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-neutral-800 transition-colors group"
                            >
                                <div className="text-left">
                                    <p className="font-medium text-white mb-1">Import / Export Data</p>
                                    <p className="text-sm text-neutral-400">Backup your library or import from JSON/CSV.</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                            </button>

                             <button
                                onClick={handleShareShelf}
                                className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-neutral-800 transition-colors group"
                            >
                                <div className="text-left">
                                    <p className="font-medium text-white mb-1">Share Public Shelf</p>
                                    <p className="text-sm text-neutral-400">Copy link to your public profile.</p>
                                </div>
                                <Share2 className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                            </button>

                             <button
                                onClick={() => setIsLegacyImportModalOpen(true)}
                                className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-neutral-800 transition-colors group"
                            >
                                <div className="text-left">
                                    <p className="font-medium text-white mb-1">Import Legacy Data</p>
                                    <p className="text-sm text-neutral-400">Migrate data from previous website (JSON).</p>
                                </div>
                                <FileJson className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </section>
                </div>
            </main>

            <ImportExportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                user={user}
                albums={albums}
                addAlbum={addAlbum}
                removeAlbum={removeAlbum}
            />
             <LegacyImportModal
                isOpen={isLegacyImportModalOpen}
                onClose={() => setIsLegacyImportModalOpen(false)}
                addAlbum={addAlbum}
            />
        </div>
    );
}
