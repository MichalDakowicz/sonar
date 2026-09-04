import { Heart, Clock, StickyNote, Play } from "lucide-react";
import Logo from "../../components/ui/Logo";
import { useLogListen } from "../../hooks/useHistory";

export default function AlbumCard({
    album,
    onClick,
    isHighlighted,
    innerRef,
    readOnly = false,
}) {
    const { logListen } = useLogListen();

    const handleLogListen = (e) => {
        e.stopPropagation();
        logListen(album);
    };

    const highlightedStyles = isHighlighted
        ? "ring-2 ring-emerald-500 scale-105 z-20 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
        : "hover:scale-105 hover:z-20 hover:shadow-2xl hover:shadow-black/50";

    const getStatusIcon = (status) => {
        switch (status) {
            case "Wishlist":
                return (
                    <Heart size={14} className="text-pink-500 fill-pink-500" />
                );
            case "Pre-order":
                return <Clock size={14} className="text-blue-500" />;
            default:
                return null;
        }
    };

    const artistName = Array.isArray(album.artist)
        ? album.artist.join(", ")
        : album.artist;
    const formatName = Array.isArray(album.format)
        ? album.format.join(" • ")
        : album.format || "Digital";
    const releaseYear = album.releaseDate
        ? album.releaseDate.split("-")[0]
        : "";

    return (
        <div
            ref={innerRef}
            onClick={onClick}
            className={`group relative aspect-square rounded-md overflow-hidden bg-neutral-900 transition-all duration-300 cursor-pointer ${highlightedStyles}`}
        >
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
                {album.coverUrl ? (
                    <img
                        src={album.coverUrl}
                        alt={album.title}
                        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${album.status === "Wishlist" ? "opacity-60 grayscale-[0.8]" : ""}`}
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-700 bg-neutral-800">
                        <Logo size={48} />
                    </div>
                )}
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/95 via-transparent to-black/60 opacity-80 transition-opacity duration-300" />

            {/* Top Details Row - Info & Actions */}
            <div className="absolute top-0 left-0 w-full p-3 z-30 flex items-start justify-between">
                {/* Top Left: Format Only (Year moved to bottom) */}
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/5">
                        <span>{formatName}</span>
                    </div>
                </div>

                {/* Top Right: Badges & Actions */}
                <div className="flex flex-col gap-1 items-end">
                    
                    {/* Notes Badge */}
                    {album.notes && (
                         <div className="flex gap-0.5 bg-black/40 backdrop-blur-md px-1.5 py-1 rounded-full text-white border border-white/10">
                            <StickyNote
                                size={12}
                                className="text-neutral-300"
                            />
                        </div>
                    )}

                    <div className="flex flex-row gap-1 items-center">
                        {/* Action Buttons - Inline */}
                        <div className="flex gap-1 items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            {!readOnly && album.status !== "Wishlist" && (
                                <button
                                    onClick={handleLogListen}
                                    className="flex items-center justify-center w-5.5 h-5.5 bg-white text-black rounded-full shadow-lg hover:bg-neutral-200 transition-colors"
                                    title="Log Listen"
                                >
                                    <Play size={10} className="fill-black ml-0.5" />
                                </button>
                            )}
                            {album.url && (
                                <a
                                    href={album.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center w-5.5 h-5.5 bg-[#1DB954] text-black rounded-full shadow-lg hover:bg-[#1ed760] transition-colors"
                                    title="Open in Spotify"
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                    </svg>
                                </a>
                            )}
                        </div>

                         {/* Status Badge - Moved here */}
                        {album.status && album.status !== "Collection" && (
                            <div className="flex gap-0.5 bg-black/40 backdrop-blur-md px-1.5 py-1 rounded-full text-white border border-white/10">
                                {getStatusIcon(album.status)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Content Area - Title, Artist & Year */}
            <div className="absolute bottom-0 left-0 w-full p-3 z-20 flex flex-col justify-end">
                <h3
                    className="truncate font-bold text-white text-base drop-shadow-md leading-tight mb-0.5"
                    title={album.title}
                >
                    {album.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-neutral-300 font-medium drop-shadow-sm">
                    <p className="truncate" title={artistName}>
                        {artistName}
                    </p>
                    <span className="ml-2 opacity-80">{releaseYear}</span>
                </div>
            </div>
        </div>
    );
}
