import { useState } from "react";
import { Navbar } from "../components/layout/Navbar";
import { useAuth } from "../features/auth/AuthContext";
import { useAlbums } from "../hooks/useAlbums";
import ImportExportModal from "../features/settings/ImportExportModal";
import LegacyImportModal from "../features/settings/LegacyImportModal";
import { useToast } from "../components/ui/Toast";
import { LogOut, Database, Share2, User, ChevronRight, Settings as SettingsIcon, FileJson } from "lucide-react";

export default function Settings() {
    const { user, logout } = useAuth();
    const { albums, addAlbum, removeAlbum } = useAlbums();
    const { toast } = useToast();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isLegacyImportModalOpen, setIsLegacyImportModalOpen] = useState(false);

    const handleShareShelf = () => {
        if (!user) return;
        const url = `https://music-tracker-89fe5.web.app/u/${user.uid}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied!",
            description: "Public shelf link copied to your clipboard.",
            variant: "default",
        });
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white pb-20">
            <Navbar />
            
            <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6 pb-8">


                <div className="flex items-center gap-3 mb-8">
                        <SettingsIcon className="text-emerald-500" size={32} />
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>

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
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName} className="w-16 h-16 rounded-full border-2 border-neutral-800" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold text-neutral-400">
                                        {user?.displayName?.[0] || user?.email?.[0] || '?'}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-lg">{user?.displayName || 'User'}</p>
                                    <p className="text-neutral-400 text-sm">{user?.email}</p>
                                </div>
                            </div>
                            
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
