import { Disc, Star, Heart, Clock, StickyNote, Play } from "lucide-react";
import { useLogListen } from "../../hooks/useHistory";
import { formatRelativeTime } from "../../lib/utils";

export default function AlbumCard({ album, onClick, isHighlighted, innerRef, readOnly = false }) {
  const { logListen } = useLogListen();
  
  const handleLogListen = (e) => {
      e.stopPropagation();
      logListen(album);
  };

  const highlightedStyles = isHighlighted 
    ? "scale-110 shadow-[0_0_30px_rgba(16,185,129,0.4)] border-emerald-500/50 z-10" 
    : "hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-neutral-700";

  const getStatusIcon = (status) => {
      switch(status) {
          case 'Wishlist': return <Heart size={14} className="text-pink-500 fill-pink-500" />;
          case 'Pre-order': return <Clock size={14} className="text-blue-500" />;
          default: return null;
      }
  };

  return (
    <div 
      ref={innerRef}
      onClick={onClick}
      className={`group h-full flex flex-col relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 transition-all duration-300 cursor-pointer ${highlightedStyles}`}
    >
      <div className="aspect-square w-full overflow-hidden bg-neutral-800 relative shrink-0">
        {album.coverUrl ? (
          <img  
            src={album.coverUrl} 
            alt={album.title} 
            className={`h-full w-full object-cover transition-opacity ${album.status === 'Wishlist' ? 'opacity-60 grayscale-[0.8]' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-700">
            <Disc size={48} />
          </div>
        )}
        
        {/* Badges Container */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {album.rating > 0 && (
            <div className="flex gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-1 rounded-full">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-white leading-none">{album.rating}</span>
            </div>
            )}
            {album.notes && (
             <div className="flex gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-1 rounded-full text-white" title="Has notes">
                 <StickyNote size={12} className="text-neutral-300" />
             </div>
            )}
            {album.status && album.status !== 'Collection' && (
             <div className="flex gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-1 rounded-full text-white" title={album.status}>
                 {getStatusIcon(album.status)}
             </div>
            )}
        </div>

        {/* Spotify Deep Link & Play Button */}
        <div className="absolute bottom-2 right-2 flex gap-2 translate-y-0 opacity-100 sm:translate-y-2 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300 z-20">
             {/* Log Listen Button */}
            {!readOnly && (
            <button
                onClick={handleLogListen}
                className="w-8 h-8 rounded-full bg-white text-black shadow-lg hover:bg-neutral-200 hover:scale-110 transition-all duration-200 flex items-center justify-center"
                title="Log Listen"
            >
                <Play size={16} className="fill-black ml-0.5" />
            </button>
            )}

            {/* Spotify Link */}
            {album.url && (
                <a 
                    href={album.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 rounded-full bg-[#1DB954] text-black shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
                    title="Open in Spotify"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                </a>
            )}
        </div>
      </div>
      
      <div className="p-4 relative flex flex-col flex-1">
        <h3 className="truncate font-bold text-white text-lg leading-tight" title={album.title}>{album.title}</h3>
        <p className="truncate text-sm text-neutral-400 font-medium" title={Array.isArray(album.artist) ? album.artist.join(", ") : album.artist}>
            {Array.isArray(album.artist) ? album.artist.join(", ") : album.artist}
        </p>
        
        <div className="mt-2 h-4 my-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            {album.lastListened && (
                <>
                    <Clock size={12} />
                    <span>Spun {formatRelativeTime(album.lastListened)}</span>
                </>
            )}
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 mt-auto">
          <span>{album.releaseDate}</span>
          <span className={`uppercase tracking-wider rounded border px-2 py-0.5 max-w-[60%] truncate transition-colors ${isHighlighted ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-neutral-800 group-hover:border-neutral-700'}`}>
            {Array.isArray(album.format) ? album.format.join(" • ") : (album.format || 'Digital')}
          </span>
        </div>
      </div>
    </div>
  );
}
