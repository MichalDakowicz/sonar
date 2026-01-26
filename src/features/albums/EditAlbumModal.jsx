import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

export default function EditAlbumModal({ isOpen, onClose, album, onUpdate, onDelete }) {
  const [formats, setFormats] = useState([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState([]);
  const [artistInput, setArtistInput] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (album) {
      setFormats(Array.isArray(album.format) ? album.format : [album.format || "Digital"]);
      setTitle(album.title || "");
      
      // Migration logic
      if (Array.isArray(album.artist)) {
          setArtist(album.artist);
      } else if (typeof album.artist === 'string') {
          // Prioritize semicolon but fallback to comma if no semicolon (legacy)
          if (album.artist.includes(";")) {
             setArtist(album.artist.split(";").map(a => a.trim()).filter(Boolean));
          } else {
             // For string like "Tyler, The creator", we do NOT want to split by comma anymore based on user feedback.
             // But if it was "Artist A, Artist B", we might want to.
             // To be safe, we treat existing string as ONE element if possible, 
             // but previously I instructed comma separation.
             // Given the user specifically mentioned "Tyler, The Creator" issue, 
             // let's treat the entire string as one artist if no semicolon is found.
             // If user wants to split, they can delete and add two tags.
             setArtist([album.artist]);
          }
      } else {
          setArtist([]);
      }

      setCoverUrl(album.coverUrl || "");
      setReleaseDate(album.releaseDate || "");
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

  if (!isOpen || !album) return null;

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
        releaseDate
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
        className="w-full max-w-md rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 p-4">
          <h2 className="text-lg font-bold text-white">Edit Album</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Main Details Section */}
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
                 <div className="flex flex-wrap gap-1 mb-1 max-h-16 overflow-y-auto">
                        {artist.map((a, i) => (
                            <span key={i} className="flex items-center gap-1 bg-neutral-800 text-[10px] px-1.5 py-0.5 rounded text-neutral-300 border border-neutral-700">
                                <span className="truncate max-w-[80px]" title={a}>{a}</span>
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
                     <button onClick={addArtist} className="bg-neutral-800 text-white px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-700 cursor-pointer text-[10px] font-bold text-emerald-500">Add</button>
                </div>
              </div>
            </div>
          </div>

          {/* Cover & Date Inputs */}
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

          {/* Formats Section */}
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

        {/* Footer Actions */}
        <div className="bg-neutral-950 p-4 border-t border-neutral-800 flex items-center justify-between">
            <button 
                onClick={handleDelete}
                disabled={loading}
                className="text-red-500 hover:text-red-400 text-sm font-medium px-2 py-1 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
            >
                {loading ? "Processing..." : "Remove Album"}
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
