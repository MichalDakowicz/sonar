import { useState, useEffect } from "react";
import { X, Check, Link, Trash2, Library, Heart, Clock, Disc, Disc3, CassetteTape, FileAudio } from "lucide-react";

export default function EditAlbumModal({ isOpen, onClose, album, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState("main"); // "main" | "details"

  // -- Main Fields --
  const [formats, setFormats] = useState([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState([]);
  const [artistInput, setArtistInput] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [releaseDate, setReleaseDate] = useState("");

  const [status, setStatus] = useState("Collection"); // Collection, Wishlist, Pre-order
  const [albumUrl, setAlbumUrl] = useState("");

  // -- Details Fields --
  const [notes, setNotes] = useState("");
  const [favoriteTracks, setFavoriteTracks] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [storeName, setStoreName] = useState("");
  const [pricePaid, setPricePaid] = useState("");
  const [catalogNumber, setCatalogNumber] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (album) {
      setActiveTab("main");
      setFormats(Array.isArray(album.format) ? album.format : [album.format || "Digital"]);
      setTitle(album.title || "");
      setStatus(album.status || "Collection");
      setAlbumUrl(album.url || "");
      
      // Artist Logic
      if (Array.isArray(album.artist)) {
          setArtist(album.artist);
      } else if (typeof album.artist === 'string') {
          if (album.artist.includes(";")) {
             setArtist(album.artist.split(";").map(a => a.trim()).filter(Boolean));
          } else {
             setArtist([album.artist]);
          }
      } else {
          setArtist([]);
      }

      setCoverUrl(album.coverUrl || "");
      setReleaseDate(album.releaseDate || "");

      // Details
      setNotes(album.notes || "");
      setFavoriteTracks(album.favoriteTracks || "");
      setAcquisitionDate(album.acquisitionDate || "");
      setStoreName(album.storeName || "");
      setPricePaid(album.pricePaid || "");
      setCatalogNumber(album.catalogNumber || "");
    }
  }, [album]);

  if (!isOpen || !album) return null;

  const addArtist = () => {
      if (artistInput.trim()) {
          setArtist(prev => [...prev, artistInput.trim()]);
          setArtistInput("");
      }
  };

  const removeArtist = (index) => {
      setArtist(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFormat = (f) => {
    setFormats(prev => {
      const isSelected = prev.includes(f);
      if (isSelected) {
        return prev.filter(item => item !== f);
      } else {
        return [...prev, f];
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(album.id, { 
        format: formats,
        title,
        artist,
        coverUrl,
        releaseDate,
        url: albumUrl,
        status,
        // New Fields
        notes,
        favoriteTracks,
        acquisitionDate,
        storeName,
        pricePaid,
        catalogNumber
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to remove this album from your collection?")) {
      setLoading(true);
      try {
        await onDelete(album.id);
        onClose();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-2xl rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300" 
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 shrink-0 bg-neutral-900 z-10">
          <h2 className="text-lg font-bold text-white">Edit Album</h2>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-4 pb-0">
          <div className="flex p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveTab("main")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "main" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Main Info
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "details" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Details & Notes
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* --- MAIN TAB --- */}
          {activeTab === "main" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex gap-5">
                    <div className="shrink-0 group relative">
                        <div className="h-40 w-40 rounded-lg overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950">
                            <img 
                                src={coverUrl || album.coverUrl} 
                                alt="Cover" 
                                className="h-full w-full object-cover transition-opacity duration-300"
                                onError={(e) => e.target.src = "https://placehold.co/400/262626/10b981/png?text=No+Cover"}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col gap-3">
                        <div>
                            <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Album Title</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-base text-white font-semibold placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                placeholder="Album Title"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Artist(s)</label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {artist.map((a, i) => (
                                    <span key={i} className="flex items-center gap-1.5 bg-neutral-800 text-xs px-2 py-1 rounded-md text-neutral-200 border border-neutral-700/50">
                                        <span className="truncate max-w-30" title={a}>{a}</span>
                                        <button onClick={() => removeArtist(i)} className="text-neutral-500 hover:text-red-400 transition-colors p-0.5 rounded-full hover:bg-neutral-700/50">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={artistInput}
                                    onChange={(e) => setArtistInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addArtist()}
                                    placeholder="Add artist..."
                                    className="flex-1 bg-neutral-800 border-transparent focus:border-neutral-600 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neutral-700 transition-colors"
                                />
                                <button 
                                    onClick={addArtist} 
                                    disabled={!artistInput.trim()}
                                    className="bg-neutral-800 text-emerald-500 disabled:text-neutral-600 font-semibold px-3 py-1.5 rounded-md text-xs hover:bg-neutral-700 transition-colors uppercase tracking-wide border border-transparent hover:border-neutral-600"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 flex items-center gap-2">
                            <Link size={12} /> Cover Image URL
                        </label>
                        <input 
                            type="text" 
                            value={coverUrl}
                            onChange={(e) => setCoverUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-neutral-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 flex items-center gap-2">
                            <Link size={12} /> Album Link / Spotify URL
                        </label>
                        <input 
                            type="text" 
                            value={albumUrl}
                            onChange={(e) => setAlbumUrl(e.target.value)}
                            placeholder="https://open.spotify.com/album/..."
                            className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-neutral-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Release Date</label>
                        <input 
                            type="text" 
                            value={releaseDate}
                            onChange={(e) => setReleaseDate(e.target.value)}
                            placeholder="YYYY-MM-DD"
                            className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Status</label>
                        <div className="flex bg-neutral-800 p-1 rounded-lg">
                            <button
                                onClick={() => setStatus("Collection")}
                                className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${
                                    status === "Collection" 
                                    ? "bg-emerald-500 text-black shadow-sm" 
                                    : "text-neutral-500 hover:text-neutral-300"
                                }`}
                                title="Collection"
                            >
                                <Library size={16} strokeWidth={status === "Collection" ? 2.5 : 2} />
                            </button>
                            <button
                                onClick={() => setStatus("Wishlist")}
                                className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${
                                    status === "Wishlist" 
                                    ? "bg-pink-500 text-white shadow-sm" 
                                    : "text-neutral-500 hover:text-neutral-300"
                                }`}
                                title="Wishlist"
                            >
                                <Heart size={16} strokeWidth={status === "Wishlist" ? 2.5 : 2} />
                            </button>
                            <button
                                onClick={() => setStatus("Pre-order")}
                                className={`flex-1 flex items-center justify-center p-1.5 rounded-md transition-all ${
                                    status === "Pre-order" 
                                    ? "bg-blue-500 text-white shadow-sm" 
                                    : "text-neutral-500 hover:text-neutral-300"
                                }`}
                                title="Pre-order"
                            >
                                <Clock size={16} strokeWidth={status === "Pre-order" ? 2.5 : 2} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-neutral-800/50">
                    <label className="text-xs font-medium text-neutral-400 uppercase mb-3 block">Formats in Collection</label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: "Digital", icon: FileAudio },
                            { id: "Vinyl", icon: Disc },
                            { id: "CD", icon: Disc3 },
                            { id: "Cassette", icon: CassetteTape }
                        ].map((f) => {
                        const isSelected = formats.includes(f.id);
                        const Icon = f.icon;
                        return (
                            <button
                            key={f.id}
                            onClick={() => toggleFormat(f.id)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all border cursor-pointer select-none ${
                                isSelected
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]"
                                : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300 hover:bg-neutral-800"
                            }`}
                            >
                             <Icon size={14} strokeWidth={2.5} className={isSelected ? "text-emerald-500" : "text-neutral-500 group-hover:text-neutral-300"} />
                            {f.id}
                            </button>
                        );
                        })}
                    </div>
                </div>
            </div>
          )}

          {/* --- DETAILS TAB --- */}
          {activeTab === "details" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Note Area */}
                <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Review / Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                        className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none placeholder-neutral-600 leading-relaxed"
                        placeholder="Write your thoughts regarding this album, sound quality, memories..."
                    />
                </div>



                <div>
                    <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Favorite Tracks</label>
                    <input
                        type="text"
                        value={favoriteTracks}
                        onChange={(e) => setFavoriteTracks(e.target.value)}
                        className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-neutral-600"
                        placeholder="e.g. Track 1, Track 4..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Acquired Date</label>
                        <input
                            type="date"
                            value={acquisitionDate}
                            onChange={(e) => setAcquisitionDate(e.target.value)}
                            className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 scheme-dark"
                        />
                    </div>
                     <div>
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Store / Source</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-neutral-600"
                            placeholder="e.g. Local Record Shop"
                        />
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Price Paid</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-neutral-500 text-sm">$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={pricePaid}
                                onChange={(e) => setPricePaid(e.target.value)}
                                className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md pl-6 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-neutral-600"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Catalog Number</label>
                        <input
                            type="text"
                            value={catalogNumber}
                            onChange={(e) => setCatalogNumber(e.target.value)}
                            className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-neutral-600"
                            placeholder="e.g. ABC-1234"
                        />
                    </div>
                </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-neutral-950 p-4 border-t border-neutral-800 flex items-center justify-between shrink-0">
            <button 
                onClick={handleDelete}
                disabled={loading}
                className="text-red-500 hover:text-red-400 text-sm font-medium px-2 py-1 hover:bg-red-500/10 rounded transition-colors cursor-pointer flex items-center gap-1"
            >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Remove</span>
            </button>
            
            <div className="flex gap-3">
                 <button 
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-black hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
