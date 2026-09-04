import { useState, useEffect } from "react";
import { X, Search, Loader2, Plus, PenLine, Link, Check, Library, Heart, Clock, Disc, Disc3, CassetteTape, FileAudio } from "lucide-react";
import { fetchAlbumMetadata, searchAlbums } from "../../services/spotify";

export default function AddAlbumModal({ isOpen, onClose, onAdd }) {
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState("main"); // "main" | "details"

  // Editable fields state
  // -- Main --
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState([]);
  const [coverUrl, setCoverUrl] = useState("");
  const [albumUrl, setAlbumUrl] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [formats, setFormats] = useState(["Digital"]);
  const [artistInput, setArtistInput] = useState("");
  const [status, setStatus] = useState("Collection");
  
  // -- Details --
  const [notes, setNotes] = useState("");
  const [favoriteTracks, setFavoriteTracks] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [storeName, setStoreName] = useState("");
  const [pricePaid, setPricePaid] = useState("");
  const [catalogNumber, setCatalogNumber] = useState("");

  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setActiveTab("main");
    setInputVal("");
    setArtistInput("");
    setPreview(null);
    setSearchResults([]);
    setFormats(["Digital"]);
    setTitle("");
    setArtist([]);
    setCoverUrl("");
    setAlbumUrl("");
    setReleaseDate("");
    setStatus("Collection");
    
    // Reset details
    setNotes("");
    setFavoriteTracks("");
    setAcquisitionDate("");
    setStoreName("");
    setPricePaid("");
    setCatalogNumber("");
    
    setError("");
  };

  // Sync state when preview changes
  useEffect(() => {
    if (preview) {
      setTitle(preview.title || "");
      // normalized as array
      if (Array.isArray(preview.artist)) {
          setArtist(preview.artist);
      } else if (typeof preview.artist === 'string') {
          // Fallback legacy parse
          setArtist(preview.artist.split(";").map(a => a.trim()).filter(Boolean));
      } else {
          setArtist([]);
      }
      setCoverUrl(preview.coverUrl || "");
      setAlbumUrl(preview.url || "");
      setReleaseDate(preview.releaseDate || "");
    }
  }, [preview]);

  // Debounce search/fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputVal.trim()) {
        performAction(inputVal);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputVal]);

  const performAction = async (val) => {
    setLoading(true);
    setError("");
    
    try {
      const isUrl = val.includes("spotify.com") || val.includes("spotify:album:");
      
      if (isUrl) {
        const data = await fetchAlbumMetadata(val);
        setPreview(data);
        setSearchResults([]); 
      } else {
        const results = await searchAlbums(val);
        setSearchResults(results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (album) => {
    setPreview(album);
    setSearchResults([]);
  };

  const handleManualEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    setPreview({
        title: "",
        artist: [],
        coverUrl: "",
        releaseDate: today,
        isManual: true
    });
    setSearchResults([]);
    setInputVal("");
  };

  const addArtist = () => {
      if (artistInput.trim()) {
          setArtist(prev => [...prev, artistInput.trim()]);
          setArtistInput("");
      }
  };

  const removeArtist = (index) => {
      setArtist(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      // Use the edited state values
      const albumData = {
        ...preview,
        title,
        artist,
        coverUrl,
        albumUrl,
        releaseDate,
        format: formats,
        status,
        // Details
        notes,
        favoriteTracks,
        acquisitionDate,
        storeName,
        pricePaid,
        catalogNumber
      };
      
      // If manual, remove the fake isManual flag and ensure id is handled by database push
      if (albumData.isManual) {
        delete albumData.isManual;
        delete albumData.id; 
      }

      await onAdd(albumData); 
      onClose();
    } catch (err) {
      setError("Failed to save album.");
    } finally {
      setLoading(false);
    }
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

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 shrink-0 bg-neutral-900/50 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white">Add Album</h2>
            {preview && <span className="text-xs text-neutral-500">Edit details before saving</span>}
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Input Area - Only show if NO preview/form is active */}
          {!preview && (
            <div className="space-y-4">
                <div className="relative">
                    <div className="flex items-center gap-2 rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 focus-within:border-emerald-500 ring-1 ring-transparent focus-within:ring-emerald-500 transition-all">
                        <Search size={18} className="text-neutral-500" />
                        <input
                        type="text"
                        placeholder="Paste URL or search album..."
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-white placeholder-neutral-600 focus:outline-none"
                        autoFocus
                        />
                        {loading && <Loader2 size={16} className="animate-spin text-emerald-500" />}
                    </div>
                </div>

                <div className="relative flex py-1 items-center">
                    <div className="grow border-t border-neutral-800"></div>
                    <span className="shrink-0 mx-4 text-xs text-neutral-500 uppercase tracking-widest">OR</span>
                    <div className="grow border-t border-neutral-800"></div>
                </div>

                <button 
                    onClick={handleManualEntry}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                >
                    <PenLine size={16} />
                    Enter Details Manually
                </button>
            </div>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          {/* Search Results List */}
          {!preview && searchResults.length > 0 && (
            <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Search Results</p>
                {searchResults.map((album) => (
                    <button
                        key={album.spotifyId}
                        onClick={() => handleSelectResult(album)}
                        className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-neutral-800 transition-colors text-left group cursor-pointer"
                    >
                        <img src={album.coverUrl} alt="" className="h-10 w-10 rounded object-cover bg-neutral-800" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm truncate group-hover:text-emerald-400">{album.title}</h4>
                            <p className="text-xs text-neutral-500 truncate">{album.artist}</p>
                        </div>
                        <Plus size={16} className="text-neutral-600 group-hover:text-white" />
                    </button>
                ))}
            </div>
          )}

          {/* Album Edit Form (Previously "Preview") */}
          {preview && (
            <div className="bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              
              {/* Tabs Header */}
              <div className="px-4 pt-4 pb-0 bg-neutral-900 border-b border-neutral-800">
                <div className="flex p-1 bg-neutral-950 rounded-lg border border-neutral-800 mb-4">
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

              <div className="p-4 space-y-6">
                
                {/* --- MAIN TAB --- */}
                {activeTab === "main" && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-5">
                    <div className="flex justify-between items-center -mt-2">
                         <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Core Info</span>
                        <button onClick={() => setPreview(null)} className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold cursor-pointer uppercase tracking-wider hover:underline">Reset</button>
                    </div>

                    <div className="flex gap-5">
                        <div className="shrink-0 group relative">
                            <div className="h-40 w-40 rounded-lg overflow-hidden border border-neutral-800 shadow-xl bg-neutral-900">
                                <img 
                                    src={coverUrl || "https://placehold.co/400/262626/10b981/png?text=No+Cover"} 
                                    alt="Cover" 
                                    className="h-full w-full object-cover" 
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
                                            {a}
                                            <button onClick={() => removeArtist(i)} className="text-neutral-500 hover:text-red-400 transition-colors p-0.5 rounded-full hover:bg-neutral-700/50"><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={artistInput}
                                        onChange={(e) => setArtistInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addArtist()}
                                        className="flex-1 bg-neutral-800 border-transparent focus:border-neutral-600 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neutral-700 transition-colors"
                                        placeholder="Add artist..."
                                    />
                                    <button onClick={addArtist} className="bg-neutral-800 text-emerald-500 disabled:text-neutral-600 font-semibold px-3 py-1.5 rounded-md text-xs hover:bg-neutral-700 transition-colors uppercase tracking-wide border border-transparent hover:border-neutral-600" disabled={!artistInput.trim()}>Add</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 flex items-center gap-2">
                                <Link size={12} /> Cover URL
                            </label>
                            <input 
                                type="text" 
                                value={coverUrl}
                                onChange={(e) => setCoverUrl(e.target.value)}
                                className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-neutral-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                placeholder="https://..."
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
                                className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-neutral-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                placeholder="https://open.spotify.com/album/..."
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Release Date</label>
                            <input 
                                type="text" 
                                value={releaseDate}
                                onChange={(e) => setReleaseDate(e.target.value)}
                                className="w-full bg-neutral-800 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                placeholder="YYYY-MM-DD"
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

                    <div className="pt-2 border-t border-neutral-800/50">
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-3 block">Formats</label>
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
                   <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Review / Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                            className="w-full bg-neutral-900 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none placeholder-neutral-600 leading-relaxed"
                            placeholder="Write your thoughts..."
                        />
                      </div>



                      <div>
                        <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Favorite Tracks</label>
                        <input
                            type="text"
                            value={favoriteTracks}
                            onChange={(e) => setFavoriteTracks(e.target.value)}
                            className="w-full bg-neutral-900 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-neutral-700"
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
                                className="w-full bg-neutral-900 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 scheme-dark"
                            />
                         </div>
                         <div>
                            <label className="text-xs font-medium text-neutral-500 uppercase mb-1.5 block">Store / Source</label>
                            <input
                                type="text"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                className="w-full bg-neutral-900 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-neutral-700"
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
                                    className="w-full bg-neutral-900 border-transparent focus:border-emerald-500 rounded-md pl-6 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-neutral-700"
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
                                className="w-full bg-neutral-900 border-transparent focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder-neutral-700"
                                placeholder="e.g. ABC-1234, 1st Pressing"
                            />
                         </div>
                      </div>
                   </div>
                )}

              </div>
            </div>
          )}
        </div>

        <div className="border-t border-neutral-800 p-4 flex justify-end gap-3 mt-auto shrink-0 bg-neutral-900 z-10">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!preview || loading || formats.length === 0 || !title}
            className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-lg shadow-emerald-900/20"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Add to Library
          </button>
        </div>
      </div>
    </div>
  );
}
