import { useState, useEffect } from "react";
import { X, Check, Star, Link, Trash2 } from "lucide-react";

export default function EditAlbumModal({ isOpen, onClose, album, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState("main"); // "main" | "details"

  // -- Main Fields --
  const [formats, setFormats] = useState([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState([]);
  const [artistInput, setArtistInput] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("Collection");

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
      setRating(album.rating || 0);
      setStatus(album.status || "Collection");
      
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
        rating,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 delay-75 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-2xl rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 shrink-0 bg-neutral-900">
          <h2 className="text-lg font-bold text-white">Edit Album</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-neutral-900/50 border-b border-neutral-800 shrink-0">
            <button
                onClick={() => setActiveTab("main")}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === "main" ? "bg-neutral-800 text-white border-b-2 border-emerald-500" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                }`}
            >
                General
            </button>
            <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === "details" ? "bg-neutral-800 text-white border-b-2 border-emerald-500" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                }`}
            >
                Details & Notes
            </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* --- MAIN TAB --- */}
          {activeTab === "main" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex gap-4">
                    <div className="shrink-0">
                    <img 
                        src={coverUrl || album.coverUrl} 
                        alt="Cover" 
                        className="h-28 w-28 rounded object-cover bg-neutral-800 shadow-lg border border-neutral-800" 
                        onError={(e) => e.target.src = "https://placehold.co/400/262626/10b981/png?text=No+Cover"}
                    />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-28">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Album Title</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded bg-neutral-950 border border-neutral-800 px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Artist</label>
                        <div className="flex flex-wrap gap-1 mb-1 max-h-16 overflow-y-auto custom-scrollbar">
                                {artist.map((a, i) => (
                                    <span key={i} className="flex items-center gap-1 bg-neutral-800 text-[10px] px-1.5 py-0.5 rounded text-neutral-300 border border-neutral-700">
                                        <span className="truncate max-w-20" title={a}>{a}</span>
                                        <button onClick={() => removeArtist(i)} className="hover:text-white cursor-pointer"><X size={10} /></button>
                                    </span>
                                ))}
                        </div>
                        <div className="flex gap-1">
                            <input 
                                type="text" 
                                value={artistInput}
                                onChange={(e) => setArtistInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addArtist()}
                                placeholder="Add Artist"
                                className="w-full rounded bg-neutral-950 border border-neutral-800 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button onClick={addArtist} className="bg-neutral-800 text-white px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-700 cursor-pointer text-[10px] font-bold">Add</button>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Cover Image URL</label>
                            <input 
                                type="text" 
                                value={coverUrl}
                                onChange={(e) => setCoverUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full rounded bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                            />
                        </div>
                    <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Release Date</label>
                            <input 
                                type="text" 
                                value={releaseDate}
                                onChange={(e) => setReleaseDate(e.target.value)}
                                placeholder="YYYY-MM-DD"
                                className="w-full rounded bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Rating</label>
                        <div className="flex gap-1" style={{ height: "30px", alignItems: "center" }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`transition-colors cursor-pointer ${star <= rating ? "text-yellow-400" : "text-neutral-700 hover:text-neutral-500"}`}
                            >
                                <Star size={20} fill={star <= rating ? "currentColor" : "none"} />
                            </button>
                            ))}
                            {rating > 0 && (
                            <button onClick={() => setRating(0)} className="text-xs text-neutral-600 hover:text-neutral-400 ml-2 cursor-pointer">
                                Clear
                            </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Status</label>
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                        >
                                <option value="Collection">Collection</option>
                                <option value="Wishlist">Wishlist</option>
                                <option value="Pre-order">Pre-order</option>

                        </select>
                    </div>
                    </div>

                <div className="pt-2 border-t border-neutral-800">
                    <div className="flex justify-between items-baseline mb-3">
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide">Formats in Collection</label>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {["Digital", "Vinyl", "CD", "Cassette"].map((f) => {
                        const isSelected = formats.includes(f);
                        return (
                            <button
                            key={f}
                            onClick={() => toggleFormat(f)}
                            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all border cursor-pointer ${
                                isSelected
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                            }`}
                            >
                            {isSelected && <Check size={14} />}
                            {f}
                            </button>
                        );
                        })}
                    </div>
                </div>
            </div>
          )}

          {/* --- DETAILS TAB --- */}
          {activeTab === "details" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Personal Notes / Review</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none placeholder-neutral-700"
                    placeholder="Write your thoughts regarding this album, sound quality, memories..."
                />
                </div>

                <div>
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Favorite Tracks</label>
                <input
                    type="text"
                    value={favoriteTracks}
                    onChange={(e) => setFavoriteTracks(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-neutral-700"
                    placeholder="e.g. Track 1, Track 4..."
                />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Acquired Date</label>
                    <input
                        type="date"
                        value={acquisitionDate}
                        onChange={(e) => setAcquisitionDate(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Store / Source</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-neutral-700"
                            placeholder="e.g. Local Record Shop"
                        />
                     </div>
                    <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Price Paid</label>
                    <div className="relative">
                        <span className="absolute left-2 top-1.5 text-neutral-500 text-sm">$</span>
                        <input
                            type="number"
                            step="0.01"
                            value={pricePaid}
                            onChange={(e) => setPricePaid(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded pl-5 pr-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-neutral-700"
                            placeholder="0.00"
                        />
                    </div>
                    </div>
                </div>

                <div>
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Catalog Number / Pressing</label>
                <input
                    type="text"
                    value={catalogNumber}
                    onChange={(e) => setCatalogNumber(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-neutral-700"
                    placeholder="e.g. ABC-1234, 1st Pressing"
                />
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
