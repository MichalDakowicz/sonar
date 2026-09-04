import { X, Calendar, Music, StickyNote, Store } from "lucide-react";

export default function AlbumDetailsModal({ isOpen, onClose, album }) {
  if (!isOpen || !album) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Header Image Background */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden">
             
          {album.coverUrl ? (
             <>
             <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-50" style={{ backgroundImage: `url(${album.coverUrl})` }} />
             <div className="absolute inset-0 bg-linear-to-t from-neutral-900 to-transparent" />
             </>
          ) : (
            <div className="absolute inset-0 bg-neutral-800" />
          )}

           <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          <div className="absolute bottom-0 left-0 p-6 flex items-end gap-6 w-full">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg border-2 border-neutral-800 shadow-xl bg-neutral-800">
                {album.coverUrl && <img src={album.coverUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="mb-2 min-w-0 flex-1">
                <h2 className="text-3xl font-bold text-white truncate leading-tight">{album.title}</h2>
                <div className="text-xl text-neutral-300 truncate">
                    {Array.isArray(album.artist) ? album.artist.join(", ") : album.artist}
                </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-800/10 rounded-lg p-3 border border-neutral-800">
                    <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Release Date</div>
                    <div className="flex items-center gap-2 text-neutral-200">
                        <Calendar size={16} className="text-emerald-500"/>
                        <span className="font-mono text-sm">{album.releaseDate || 'Unknown'}</span>
                    </div>
                </div>
                <div className="bg-neutral-800/10 rounded-lg p-3 border border-neutral-800">
                    <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Formats</div>
                     <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(album.format) ? album.format : [album.format || "Digital"]).map((fmt, i) => (
                             <span key={i} className="px-2 py-0.5 rounded text-xs bg-neutral-900 text-neutral-300 border border-neutral-700 font-medium">
                                {fmt}
                             </span>
                        ))}
                    </div>
                </div>

                 <div className="bg-neutral-800/10 rounded-lg p-3 border border-neutral-800">
                    <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Genres</div>
                    <div className="flex flex-wrap gap-1">
                         {album.genres && album.genres.length > 0 ? (
                             album.genres.map((g, i) => (
                                 <span key={i} className="text-sm text-neutral-300">
                                     {g}{i < album.genres.length - 1 ? ", " : ""}
                                 </span>
                             ))
                         ) : (
                             <span className="text-neutral-500 italic text-sm">No genres listed</span>
                         )}
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            {album.notes && (
                <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase flex items-center gap-2 tracking-wide">
                        <StickyNote size={14} /> Personal Notes
                    </h3>
                    <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-800/50 text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
                        {album.notes}
                    </div>
                </div>
            )}

             {/* Favorite Tracks */}
            {album.favoriteTracks && (
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase flex items-center gap-2">
                        <Music size={14} /> Favorite Tracks
                    </h3>
                    <div className="p-4 rounded-lg bg-neutral-800/30 border border-neutral-800 text-neutral-300 leading-relaxed whitespace-pre-wrap">
                        {album.favoriteTracks}
                    </div>
                </div>
            )}

            {/* Acquisition Info (if strictly relevant to public? Maybe hide price, keep store/date) */}
            {(album.acquisitionDate || album.storeName) && (
                 <div className="pt-4 border-t border-neutral-800 flex flex-wrap gap-6 text-sm text-neutral-500">
                    {album.acquisitionDate && (
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            Acquired: <span className="text-neutral-400">{album.acquisitionDate}</span>
                        </div>
                    )}
                    {album.storeName && (
                        <div className="flex items-center gap-1.5">
                            <Store size={14} />
                            Store: <span className="text-neutral-400">{album.storeName}</span>
                        </div>
                    )}
                 </div>
            )}

        </div>
      </div>
    </div>
  );
}
