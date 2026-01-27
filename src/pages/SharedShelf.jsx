import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { usePublicAlbums } from "../hooks/usePublicAlbums";
import AlbumCard from "../features/albums/AlbumCard";
import AlbumRow from "../features/albums/AlbumRow";
import AlbumDetailsModal from "../features/albums/AlbumDetailsModal";
import { LayoutGrid, List as ListIcon, Search, Disc, Loader2 } from "lucide-react";

export default function SharedShelf() {
  const { userId } = useParams();
  const { albums, loading } = usePublicAlbums(userId);
  
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const filteredAlbums = useMemo(() => {
    if (!searchQuery) return albums;
    const q = searchQuery.toLowerCase();
    return albums.filter(a => {
        const titleMatch = a.title.toLowerCase().includes(q);
        const artistStr = Array.isArray(a.artist) ? a.artist.join(" ").toLowerCase() : (a.artist || "").toLowerCase();
        return titleMatch || artistStr.includes(q);
    });
  }, [albums, searchQuery]);

  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-black text-emerald-500">
              <Loader2 size={48} className="animate-spin" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col gap-6">
      <AlbumDetailsModal 
        isOpen={!!selectedAlbum}
        album={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
      />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Disc className="text-emerald-500" />
                Public Shelf
            </h1>
            <p className="text-neutral-400 mt-1">Viewing collection shared by user</p>
        </div>
        
        <div className="flex items-center gap-2">
           <Link to="/" className="text-sm text-emerald-500 hover:text-emerald-400 font-medium px-4 py-2 hover:bg-neutral-900 rounded-md transition-colors">
              Create your own Tracker
           </Link>
        </div>
      </header>

      {/* Toolbar */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row gap-3 bg-black/95 backdrop-blur-sm p-2 -mx-2 rounded-lg border-b border-neutral-900/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text" 
            placeholder="Search this collection..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        
        <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-neutral-800 text-emerald-500 shadow-sm" : "text-neutral-400 hover:text-white"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-neutral-800 text-emerald-500 shadow-sm" : "text-neutral-400 hover:text-white"}`}
            >
              <ListIcon size={18} />
            </button>
        </div>
      </div>

        {/* Content */}
        {filteredAlbums.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                <Disc size={48} className="mb-4 opacity-20" />
                <p>No albums found in this collection.</p>
             </div>
        ) : (
            viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                    {filteredAlbums.map(album => (
                        <AlbumCard 
                            key={album.id} 
                            album={album} 
                            onClick={() => setSelectedAlbum(album)}
                            readOnly={true}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredAlbums.map(album => (
                        <AlbumRow 
                            key={album.id} 
                            album={album} 
                            onClick={() => setSelectedAlbum(album)}
                            readOnly={true}
                        />
                    ))}
                </div>
            )
        )}
    </div>
  );
}
