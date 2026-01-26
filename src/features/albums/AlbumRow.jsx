export default function AlbumRow({ album, onClick, isHighlighted, innerRef }) {
  const highlightedStyles = isHighlighted 
    ? "bg-neutral-800 border-l-4 border-l-emerald-500" 
    : "bg-neutral-900 border-l-4 border-l-transparent hover:bg-neutral-800 hover:border-l-neutral-700";

  return (
    <div 
      ref={innerRef}
      onClick={onClick}
      className={`flex items-center gap-4 rounded-md p-3 transition-all duration-200 group cursor-pointer ${highlightedStyles}`}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-800 relative">
        {album.coverUrl && <img src={album.coverUrl} alt="" className="h-full w-full object-cover" />}
        {isHighlighted && <div className="absolute inset-0 bg-emerald-500/10" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`truncate font-bold transition-colors ${isHighlighted ? 'text-emerald-400' : 'text-white group-hover:text-emerald-300'}`}>{album.title}</h3>
        <p className="truncate text-sm text-neutral-400">
            {Array.isArray(album.artist) ? album.artist.join(", ") : album.artist}
        </p>
      </div>
      <div className="hidden sm:block text-sm text-neutral-500 w-24 text-right">
        {album.releaseDate}
      </div>
      <div className="w-20 text-right">
        <span className="text-[10px] font-medium text-neutral-400 uppercase border border-neutral-700 px-2 py-1 rounded inline-block truncate max-w-full">
          {Array.isArray(album.format) ? album.format.join(" • ") : (album.format || 'Digital')}
        </span>
      </div>
    </div>
  );
}
