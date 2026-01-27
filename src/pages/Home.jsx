import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { useAlbums } from "../hooks/useAlbums";
import { useToast } from "../components/ui/Toast";
import { Link } from "react-router-dom";
import AlbumCard from "../features/albums/AlbumCard";
import AlbumRow from "../features/albums/AlbumRow";
import AddAlbumModal from "../features/albums/AddAlbumModal";
import EditAlbumModal from "../features/albums/EditAlbumModal";
import StatsModal from "../features/stats/StatsModal";
import ImportExportModal from "../features/settings/ImportExportModal";
import RandomSpinModal from "../features/albums/RandomSpinModal";
import { FilterPanel } from "../components/FilterPanel";
import { 
  LogOut, Plus, LayoutGrid, List as ListIcon, 
  Search, Shuffle, Layers, BarChart3, Clock, Database, Share2
} from "lucide-react";

export default function Home() {
  const { logout, user } = useAuth();
  const { albums, loading, addAlbum, updateAlbum, removeAlbum } = useAlbums();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [groupBy, setGroupBy] = useState("none"); // "none" | "artist"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFormat, setFilterFormat] = useState("All");
  const [filterArtist, setFilterArtist] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterGenre, setFilterGenre] = useState("All");
  const [filterStatus, setFilterStatus] = useState("Collection");
  const [sortBy, setSortBy] = useState("addedAt"); // "addedAt", "releaseDate", "artist", "title"
  const [highlightedAlbumId, setHighlightedAlbumId] = useState(null);

  // Map to store refs of album elements for scrolling
  const itemsRef = useRef(new Map());

  // Extract unique artists, years, and genres for filters
  const { uniqueArtists, uniqueYears, uniqueGenres } = useMemo(() => {
    const artists = new Set();
    const years = new Set();
    const genres = new Set();

    albums.forEach(album => {
      // Normalize to array
      let albumArtists = [];
      if (Array.isArray(album.artist)) {
        albumArtists = album.artist;
      } else if (typeof album.artist === 'string') {
        // Fallback for legacy data: split by semicolon if present
        if (album.artist.includes(";")) {
           albumArtists = album.artist.split(";").map(a => a.trim());
        } else {
           // Otherwise treat as single artist (even if it has a comma)
           albumArtists = [album.artist];
        }
      }

      albumArtists.forEach(p => {
        if(p.trim()) artists.add(p.trim());
      });

      if (album.releaseDate) {
        const y = album.releaseDate.substring(0, 4);
        if (y) years.add(y);
      }

      if (album.genres && Array.isArray(album.genres)) {
        album.genres.forEach(g => genres.add(g));
      }
    });

    return {
      uniqueArtists: Array.from(artists).sort(),
      uniqueYears: Array.from(years).sort((a, b) => b - a),
      uniqueGenres: Array.from(genres).sort()
    };
  }, [albums]);

  // Derived state for filtered albums
  const filteredAlbums = useMemo(() => {
    let result = [...albums];

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => {
        const titleMatch = a.title.toLowerCase().includes(q);
        // Handle search for both string and array artists
        const artistStr = Array.isArray(a.artist) ? a.artist.join(" ").toLowerCase() : (a.artist || "").toLowerCase();
        const artistMatch = artistStr.includes(q);
        return titleMatch || artistMatch;
      });
    }

    // Filter by Format
    if (filterFormat !== "All") {
      result = result.filter(a => {
        const formats = Array.isArray(a.format) ? a.format : [a.format || "Digital"];
        return formats.includes(filterFormat);
      });
    }
    
    // Filter by Status (Default to just "Collection" if "All" is not explicit, but here user selects status)
    if (filterStatus !== "All") {
       // Legacy albums didn't have status, so assume "Collection" for undefined
       result = result.filter(a => (a.status || 'Collection') === filterStatus);
    }

    // Filter by Artist
    if (filterArtist !== "All") {
      result = result.filter(a => {
        // Normalize checking
        let albumArtists = [];
        if (Array.isArray(a.artist)) {
          albumArtists = a.artist;
        } else if (typeof a.artist === 'string') {
           if (a.artist.includes(";")) {
             albumArtists = a.artist.split(";").map(p => p.trim());
           } else {
             albumArtists = [a.artist];
           }
        }
        return albumArtists.includes(filterArtist);
      });
    }

    // Filter by Year
    if (filterYear !== "All") {
      result = result.filter(a => a.releaseDate && a.releaseDate.startsWith(filterYear));
    }

    // Filter by Genre
    if (filterGenre !== "All") {
      result = result.filter(a => a.genres && a.genres.includes(filterGenre));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "addedAt") return b.addedAt - a.addedAt;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "releaseDate") return new Date(b.releaseDate) - new Date(a.releaseDate);
      if (sortBy === "artist") {
         // Sort by first artist in list
         const artistA = Array.isArray(a.artist) ? a.artist[0] : a.artist;
         const artistB = Array.isArray(b.artist) ? b.artist[0] : b.artist;
         return (artistA || "").localeCompare(artistB || "");
      }
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [albums, searchQuery, filterFormat, filterArtist, filterYear, filterGenre, filterStatus, sortBy]);

  // Derived state for grouped albums
  const groupedAlbums = useMemo(() => {
    if (groupBy !== 'artist') return null;

    const groups = {};
    filteredAlbums.forEach(album => {
        const primaryArtist = Array.isArray(album.artist) ? album.artist[0] : album.artist;
        const key = primaryArtist || "Unknown Artist";
        if (!groups[key]) groups[key] = [];
        groups[key].push(album);
    });

    // Sort groups by key
    const sortedKeys = Object.keys(groups).sort();
    return sortedKeys.map(key => ({
        title: key,
        albums: groups[key]
    }));
  }, [filteredAlbums, groupBy]);

  // Effect to handle scrolling when highlightedAlbumId changes
  useEffect(() => {
    if (highlightedAlbumId) {
      const node = itemsRef.current.get(highlightedAlbumId);
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        // Optional: Remove highlight after a delay? 
        // For now we keep it until user clicks something else or picks new random
      }
    }
  }, [highlightedAlbumId]);

  const handleRandomPick = () => {
    if (filteredAlbums.length === 0) return;
    setIsSpinModalOpen(true);
  };

  const handleClearFilters = () => {
    setFilterFormat("All");
    setFilterArtist("All");
    setFilterYear("All");
    setFilterGenre("All");
    setFilterStatus("Collection");
    setSearchQuery("");
  };

  const handleShareShelf = () => {
    if (!user) return;
    const url = `${window.location.origin}/u/${user.uid}`;
    navigator.clipboard.writeText(url);
    toast({
        title: "Link Copied!",
        description: "Public shelf link copied to your clipboard.",
        variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200" onClick={() => setHighlightedAlbumId(null)}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto max-w-screen-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white hidden sm:block">Music Tracker</h1>
            <span className="text-xl font-bold tracking-tight text-white sm:hidden">MT</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsStatsModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-800 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Overview</span>
            </button>

            <Link 
              to="/history"
              className="flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-800 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Clock size={16} />
              <span className="hidden sm:inline">History</span>
            </Link>

             <button 
              onClick={handleRandomPick}
              className="flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-800 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Shuffle size={16} />
              <span className="hidden sm:inline">Pick Random</span>
            </button>

            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Album</span>
            </button>

            <button
               onClick={() => setIsImportModalOpen(true)}
               className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
               title="Import/Export Data"
            >
               <Database size={20} />
            </button>

            <button
               onClick={handleShareShelf}
               className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
               title="Share Public Link"
            >
               <Share2 size={20} />
            </button>

            <div className="h-6 w-px bg-neutral-800" />
            
            <button 
              onClick={logout} 
              className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-neutral-900 border border-neutral-800 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
             <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-1 shrink-0">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`rounded p-1.5 transition-colors cursor-pointer ${viewMode === "grid" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode("list")}
                  className={`rounded p-1.5 transition-colors cursor-pointer ${viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  title="List View"
                >
                  <ListIcon size={18} />
                </button>
            </div>

             <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-1 shrink-0">
                <button 
                  onClick={() => setGroupBy(groupBy === "artist" ? "none" : "artist")}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer ${groupBy === "artist" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  title="Group by Artist"
                >
                  <Layers size={16} />
                  <span className="hidden sm:inline">Group</span>
                </button>
             </div>

             <FilterPanel 
               filterFormat={filterFormat} setFilterFormat={setFilterFormat}
               filterArtist={filterArtist} setFilterArtist={setFilterArtist}
               filterGenre={filterGenre} setFilterGenre={setFilterGenre}
               filterYear={filterYear} setFilterYear={setFilterYear}
               filterStatus={filterStatus} setFilterStatus={setFilterStatus}
               sortBy={sortBy} setSortBy={setSortBy}
               uniqueArtists={uniqueArtists}
               uniqueGenres={uniqueGenres}
               uniqueYears={uniqueYears}
               onClearAll={handleClearFilters}
             />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-neutral-500">
             Loading collection...
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/50 text-neutral-500">
            <p className="mb-4">No albums found.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="text-emerald-500 hover:underline"
            >
              Add your first album
            </button>
          </div>
        ) : groupedAlbums ? (
            <div className="flex flex-col gap-8 pb-20">
            {groupedAlbums.map(group => (
                <div key={group.title}>
                    <h2 className="text-xl font-bold text-white mb-4 pl-2 flex items-center gap-2">
                            <div className="h-5 w-1 bg-emerald-500 rounded-full" />
                            {group.title} 
                            <span className="text-sm font-normal text-neutral-500">({group.albums.length})</span>
                    </h2>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-2">
                            {group.albums.map((album) => (
                            <AlbumCard 
                                key={album.id} 
                                album={album} 
                                onClick={() => setEditingAlbum(album)}
                                isHighlighted={highlightedAlbumId === album.id}
                                innerRef={(node) => {
                                    const map = itemsRef.current;
                                    if (node) map.set(album.id, node);
                                    else map.delete(album.id);
                                }}
                            />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {group.albums.map((album) => (
                            <AlbumRow 
                                key={album.id} 
                                album={album} 
                                onClick={() => setEditingAlbum(album)}
                                isHighlighted={highlightedAlbumId === album.id}
                                innerRef={(node) => {
                                    const map = itemsRef.current;
                                    if (node) map.set(album.id, node);
                                    else map.delete(album.id);
                                }}
                            />
                            ))}
                        </div>
                    )}
                </div>
            ))}
            </div>
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-2 pb-20">
              {filteredAlbums.map((album) => (
                <AlbumCard 
                    key={album.id} 
                    album={album} 
                    onClick={() => setEditingAlbum(album)}
                    isHighlighted={highlightedAlbumId === album.id}
                    innerRef={(node) => {
                        const map = itemsRef.current;
                        if (node) {
                            map.set(album.id, node);
                        } else {
                            map.delete(album.id);
                        }
                    }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-20">
              {filteredAlbums.map((album) => (
                <AlbumRow 
                    key={album.id} 
                    album={album} 
                    onClick={() => setEditingAlbum(album)}
                    isHighlighted={highlightedAlbumId === album.id}
                    innerRef={(node) => {
                        const map = itemsRef.current;
                        if (node) {
                          map.set(album.id, node);
                        } else {
                          map.delete(album.id);
                        }
                    }}
                />
              ))}
            </div>
          )
        )}
      </main>

      <AddAlbumModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={addAlbum} 
      />

      <EditAlbumModal
        isOpen={!!editingAlbum}
        onClose={() => setEditingAlbum(null)}
        album={editingAlbum}
        onUpdate={updateAlbum}
        onDelete={removeAlbum}
      />
      
      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        albums={albums}
        addAlbum={addAlbum}
        removeAlbum={removeAlbum}
      />

      <StatsModal 
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        albums={albums}
      />

      <RandomSpinModal
        isOpen={isSpinModalOpen}
        onClose={() => setIsSpinModalOpen(false)}
        albums={filteredAlbums}
        onSelect={(id) => {
            setHighlightedAlbumId(id);
            // Optionally scroll to it after modal closes?
        }}
      />
    </div>
  );
}
