import { Disc } from "lucide-react";

export default function AlbumCard({ album, onClick, isHighlighted, innerRef }) {
  const highlightedStyles = isHighlighted 
    ? "scale-110 shadow-[0_0_30px_rgba(16,185,129,0.4)] border-emerald-500/50 z-10" 
    : "hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-neutral-700";

  return (
    <div 
      ref={innerRef}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 transition-all duration-300 cursor-pointer ${highlightedStyles}`}
    >
      <div className="aspect-square w-full overflow-hidden bg-neutral-800 relative">
        {album.coverUrl ? (
          <img 
            src={album.coverUrl} 
            alt={album.title} 
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-700">
            <Disc size={48} />
          </div>
        )}
      </div>
      
      <div className="p-4 relative">
        <h3 className="truncate font-bold text-white text-lg leading-tight" title={album.title}>{album.title}</h3>
        <p className="truncate text-sm text-neutral-400 font-medium" title={Array.isArray(album.artist) ? album.artist.join(", ") : album.artist}>
            {Array.isArray(album.artist) ? album.artist.join(", ") : album.artist}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          <span>{album.releaseDate}</span>
          <span className={`uppercase tracking-wider rounded border px-2 py-0.5 max-w-[60%] truncate transition-colors ${isHighlighted ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-neutral-800 group-hover:border-neutral-700'}`}>
            {Array.isArray(album.format) ? album.format.join(" • ") : (album.format || 'Digital')}
          </span>
        </div>
      </div>
    </div>
  );
}
