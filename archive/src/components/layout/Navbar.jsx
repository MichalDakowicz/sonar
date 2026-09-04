import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../ui/Logo";
import { BarChart3, Clock, LogOut, LayoutGrid, Plus, Share2, Shuffle, Settings, Users } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { useToast } from "../ui/Toast";
import { useAlbums } from "../../hooks/useAlbums";
import AddAlbumModal from "../../features/albums/AddAlbumModal";

export function Navbar({ onPickRandom }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const { addAlbum } = useAlbums();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto max-w-screen-2xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo className="h-8 w-8 text-emerald-500 group-hover:scale-110 transition-transform" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Sonar</h1>
          </Link>

          {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            {onPickRandom && (
              <button
                onClick={onPickRandom}
                className="flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-800 hover:text-emerald-400 transition-colors cursor-pointer mr-2"
              >
                <Shuffle size={16} />
                <span className="hidden min-[780px]:inline">Pick Random</span>
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-bold text-black hover:bg-neutral-200 transition-colors cursor-pointer mr-2"
            >
              <Plus size={16} />
              <span className="hidden min-[780px]:inline">Add Album</span>
            </button>

            <Link
              to="/"
              className={`hidden min-[780px]:block p-2 rounded-md transition-colors ${isActive('/') ? 'text-white bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              title="Library"
            >
              <LayoutGrid size={20} />
            </Link>
            <Link
              to="/stats"
              className={`hidden min-[780px]:block p-2 rounded-md transition-colors ${isActive('/stats') ? 'text-white bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              title="Statistics"
            >
              <BarChart3 size={20} />
            </Link>
            <Link
              to="/history"
              className={`hidden min-[780px]:block p-2 rounded-md transition-colors ${isActive('/history') ? 'text-white bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              title="History"
            >
              <Clock size={20} />
            </Link>
            <Link
              to="/friends"
              className={`hidden min-[780px]:block p-2 rounded-md transition-colors ${isActive('/friends') ? 'text-white bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              title="Friends"
            >
              <Users size={20} />
            </Link>

            <button
                onClick={handleShareShelf}
                className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                title="Share Public Link"
            >
                <Share2 size={20} />
            </button>
            
            <div className="h-6 w-px bg-neutral-800 mx-2 hidden min-[780px]:block" />

            <Link
              to="/settings"
              className={`hidden min-[780px]:block p-2 rounded-md transition-colors ${isActive('/settings') ? 'text-white bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              title="Settings"
            >
              <Settings size={20} />
            </Link>
            
            <button
              onClick={logout}
              className="hidden min-[780px]:flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
          )}
        </div>
      </header>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-lg min-[780px]:hidden pb-safe">
            <div className="flex items-center justify-around p-2">
                <Link
                    to="/"
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        isActive('/') ? 'text-emerald-500' : 'text-neutral-400'
                    }`}
                >
                    <LayoutGrid size={24} />
                    <span className="text-[10px] font-medium">Library</span>
                </Link>
                <Link
                    to="/stats"
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        isActive('/stats') ? 'text-emerald-500' : 'text-neutral-400'
                    }`}
                >
                    <BarChart3 size={24} />
                    <span className="text-[10px] font-medium">Stats</span>
                </Link>
                <Link
                    to="/history"
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        isActive('/history') ? 'text-emerald-500' : 'text-neutral-400'
                    }`}
                >
                    <Clock size={24} />
                    <span className="text-[10px] font-medium">History</span>
                </Link>
                <Link
                    to="/friends"
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        isActive('/friends') ? 'text-emerald-500' : 'text-neutral-400'
                    }`}
                >
                    <Users size={24} />
                    <span className="text-[10px] font-medium">Friends</span>
                </Link>
                <Link
                    to="/settings"
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                        isActive('/settings') ? 'text-emerald-500' : 'text-neutral-400'
                    }`}
                >
                    <Settings size={24} />
                    <span className="text-[10px] font-medium">Settings</span>
                </Link>
            </div>
        </nav>
      )}

      {user && (
        <>
            <AddAlbumModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={addAlbum}
            />
        </>
      )}
    </>
  );
}
