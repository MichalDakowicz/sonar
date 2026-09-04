import { Star, Heart, Clock, StickyNote, Play } from "lucide-react";
import { useLogListen } from "../../hooks/useHistory";
import { formatRelativeTime } from "../../lib/utils";

export default function AlbumRow({ album, onClick, isHighlighted, innerRef }) {
  const { logListen } = useLogListen();

  const handleLogListen = (e) => {
      e.stopPropagation();
      logListen(album);
  };

  const highlightedStyles = isHighlighted 
    ? "bg-neutral-800 border-l-4 border-l-emerald-500" 
    : "bg-neutral-900 border-l-4 border-l-transparent hover:bg-neutral-800 hover:border-l-neutral-700";

  const getStatusIcon = (status) => {
      switch(status) {
          case 'Wishlist': return <Heart size={12} className="text-pink-500 fill-pink-500" />;
          case 'Pre-order': return <Clock size={12} className="text-blue-500" />;
          default: return null;
      }
  };

  return (
    <div 
      ref={innerRef}
      onClick={onClick}
      className={`flex items-center gap-4 rounded-md p-3 transition-all duration-200 group cursor-pointer ${highlightedStyles} ${album.status === 'Wishlist' ? 'bg-neutral-950/50' : ''}`}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-800 relative">
        {album.coverUrl && <img src={album.coverUrl} alt="" className={`h-full w-full object-cover ${album.status === 'Wishlist' ? 'grayscale opacity-70' : ''}`} />}
        {isHighlighted && <div className="absolute inset-0 bg-emerald-500/10" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
           <h3 className={`truncate font-bold transition-colors ${isHighlighted ? 'text-emerald-400' : 'text-white group-hover:text-emerald-300'}`}>{album.title}</h3>
           
           {/* Badges */}
           <div className="flex items-center gap-1">
                {album.rating > 0 && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">
                        <Star size={8} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-neutral-300 leading-none">{album.rating}</span>
                    </div>
                )}
                {album.notes && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700" title="Has notes">
                        <StickyNote size={10} className="text-neutral-400" />
                    </div>
                )}
                {album.status && album.status !== 'Collection' && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700" title={album.status}>
                        {getStatusIcon(album.status)}
                    </div>
                )}
           </div>
        </div>
        <p className="truncate text-sm text-neutral-400">
            {Array.isArray(album.artist) ? album.artist.join(", ") : album.artist}
        </p>
        
        {album.lastListened && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-500 mt-0.5 font-medium">
                <Clock size={10} />
                <span>Spun {formatRelativeTime(album.lastListened)}</span>
            </div>
        )}
      </div>
      <div className="hidden sm:block text-sm text-neutral-500 w-24 text-right">
        {album.releaseDate}
      </div>
      <div className="w-20 text-right">
        <span className="text-[10px] font-medium text-neutral-400 uppercase border border-neutral-700 px-2 py-1 rounded inline-block truncate max-w-full">
          {Array.isArray(album.format) ? album.format.join(" • ") : (album.format || 'Digital')}
        </span>
      </div>
      
      <div className="w-20 flex justify-end gap-2 items-center" onClick={(e) => e.stopPropagation()}>
        {album.status !== "Wishlist" && (
            <button
                onClick={handleLogListen}
                className="p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Log Listen"
            >
                <Play size={20} className="fill-current" />
            </button>
        )}

        {album.url && (
            <a 
                href={album.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-neutral-500 hover:text-[#1DB954] transition-colors p-1"
                title="Open in Spotify"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
            </a>
        )}
      </div>
    </div>
  );
}
