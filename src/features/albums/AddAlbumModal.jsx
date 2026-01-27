import { useState, useEffect } from "react";
import { X, Search, Loader2, Plus, PenLine, Link, Star, Check } from "lucide-react";
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
  const [releaseDate, setReleaseDate] = useState("");
  const [formats, setFormats] = useState(["Digital"]);
  const [artistInput, setArtistInput] = useState("");
  const [rating, setRating] = useState(0);
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
    setReleaseDate("");
    setRating(0);
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
        releaseDate,
        format: formats,
        rating,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white">Add Album</h2>
            {preview && <span className="text-xs text-neutral-500">Edit details before saving</span>}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
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
              <div className="flex bg-neutral-900/50 border-b border-neutral-800">
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

              <div className="p-4 space-y-4">
                
                {/* --- MAIN TAB --- */}
                {activeTab === "main" && (
                  <>
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase">Core Info</h3>
                        <button onClick={() => setPreview(null)} className="text-[10px] text-emerald-500 hover:text-emerald-400 font-medium cursor-pointer uppercase tracking-wider">Reset</button>
                    </div>
                    
                    <div className="flex gap-4 items-start">
                        <div className="shrink-0 group relative">
                            <img 
                                src={coverUrl || "https://placehold.co/400/262626/10b981/png?text=No+Cover"} 
                                alt="Cover" 
                                className="h-28 w-28 rounded object-cover bg-neutral-900 shadow-md border border-neutral-800" 
                                onError={(e) => e.target.src = "https://placehold.co/400/262626/10b981/png?text=No+Cover"}
                            />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-28">
                            <div>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-bold placeholder-neutral-600"
                                    placeholder="Album Title"
                                />
                            </div>
                            <div>
                                <div className="flex flex-wrap gap-1 mb-1 max-h-9 overflow-y-auto custom-scrollbar">
                                    {artist.map((a, i) => (
                                        <span key={i} className="flex items-center gap-1 bg-neutral-800 text-[10px] px-2 py-0.5 rounded text-neutral-300 border border-neutral-700">
                                            {a}
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
                                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="Add Artist"
                                    />
                                    <button onClick={addArtist} className="bg-neutral-800 px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-700 cursor-pointer text-[10px] font-bold text-emerald-500">Add</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                <Link size={10} /> Cover URL
                            </label>
                            <input 
                                type="text" 
                                value={coverUrl}
                                onChange={(e) => setCoverUrl(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-400 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Release Date</label>
                            <input 
                                type="text" 
                                value={releaseDate}
                                onChange={(e) => setReleaseDate(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                placeholder="YYYY-MM-DD"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-1">
                        <div className="flex-1">
                            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Rating</label>
                            <div className="flex gap-1" style={{ height: "26px", alignItems: "center" }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`transition-colors cursor-pointer ${star <= rating ? "text-yellow-400" : "text-neutral-700 hover:text-neutral-500"}`}
                                    >
                                        <Star size={18} fill={star <= rating ? "currentColor" : "none"} />
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
                            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Status</label>
                            <select 
                                value={status} 
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
                            >
                                <option value="Collection">Collection</option>
                                <option value="Wishlist">Wishlist</option>
                                <option value="Pre-order">Pre-order</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800">
                        <label className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Formats</label>
                        <div className="flex flex-wrap gap-2">
                        {["Digital", "Vinyl", "CD", "Cassette"].map((f) => {
                            const isSelected = formats.includes(f);
                            return (
                            <button
                                key={f}
                                onClick={() => toggleFormat(f)}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                                    isSelected
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                                }`}
                            >
                            {isSelected && <Check size={12} />}
                            {f}
                            </button>
                            );
                        })}
                        </div>
                    </div>
                  </>
                )}

                {/* --- DETAILS TAB --- */}
                {activeTab === "details" && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Personal Notes / Review</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none placeholder-neutral-700"
                            placeholder="Write your thoughts..."
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Favorite Tracks</label>
                        <input
                            type="text"
                            value={favoriteTracks}
                            onChange={(e) => setFavoriteTracks(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-neutral-700"
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
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-sm text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                         </div>
                         <div>
                            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Store / Source</label>
                            <input
                                type="text"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-neutral-700"
                                placeholder="e.g. Local Record Shop"
                            />
                         </div>
                         <div className="col-span-2">
                            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-1">Price Paid</label>
                            <div className="relative">
                                <span className="absolute left-2 top-1.5 text-neutral-500 text-sm">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={pricePaid}
                                    onChange={(e) => setPricePaid(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded pl-5 pr-2 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-neutral-700"
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
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-neutral-700"
                            placeholder="e.g. ABC-1234, 1st Pressing"
                        />
                      </div>
                   </div>
                )}

              </div>
            </div>
          )}
        </div>

        <div className="border-t border-neutral-800 p-4 flex justify-end gap-3 mt-auto shrink-0 bg-neutral-900">
          <button onClick={onClose} className="text-sm text-neutral-400 hover:text-white px-3 py-2 cursor-pointer transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!preview || loading || formats.length === 0 || !title}
            className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-bold text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Add to Library
          </button>
        </div>
      </div>
    </div>
  );
}
