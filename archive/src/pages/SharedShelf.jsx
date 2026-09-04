import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Logo from "../components/ui/Logo";
import { useAuth } from "../features/auth/AuthContext";
import { usePublicAlbums } from "../hooks/usePublicAlbums";
import { useUserProfile } from "../hooks/useUserProfile";
import { PublicBottomNav } from "../components/layout/PublicBottomNav";
import { PublicHeader } from "../components/layout/PublicHeader";
import AlbumCard from "../features/albums/AlbumCard";
import AlbumRow from "../features/albums/AlbumRow";
import AlbumDetailsModal from "../features/albums/AlbumDetailsModal";
import { FilterPanel } from "../components/FilterPanel";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover";
import {
    LayoutGrid,
    List as ListIcon,
    Search,
    Loader2,
    Layers,
    Home as HomeIcon,
    LogOut,
    LogIn,
    BarChart3,
    Users,
} from "lucide-react";

export default function SharedShelf() {
    const { userId } = useParams();
    const { user, login, logout } = useAuth();
    const { albums, loading } = usePublicAlbums(userId);
    const { profile, loading: profileLoading } = useUserProfile(userId);

    const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAlbum, setSelectedAlbum] = useState(null);

    // Filters & Sorting State
    const [filterFormat, setFilterFormat] = useState("All");
    const [filterArtist, setFilterArtist] = useState("All");
    const [filterYear, setFilterYear] = useState("All");
    const [filterGenre, setFilterGenre] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [sortBy, setSortBy] = useState("custom");
    const [groupBy, setGroupBy] = useState("none");

    // Extract unique values for filters
    const { uniqueArtists, uniqueYears, uniqueGenres } = useMemo(() => {
        const artists = new Set();
        const years = new Set();
        const genres = new Set();

        albums.forEach((album) => {
            // Normalize artist
            let albumArtists = [];
            if (Array.isArray(album.artist)) {
                albumArtists = album.artist;
            } else if (typeof album.artist === "string") {
                if (album.artist.includes(";")) {
                    albumArtists = album.artist.split(";").map((a) => a.trim());
                } else {
                    albumArtists = [album.artist];
                }
            }

            albumArtists.forEach((p) => {
                if (p.trim()) artists.add(p.trim());
            });

            if (album.releaseDate) {
                const y = album.releaseDate.substring(0, 4);
                if (y) years.add(y);
            }

            if (album.genres && Array.isArray(album.genres)) {
                album.genres.forEach((g) => genres.add(g));
            }
        });

        return {
            uniqueArtists: Array.from(artists).sort(),
            uniqueYears: Array.from(years).sort((a, b) => b - a),
            uniqueGenres: Array.from(genres).sort(),
        };
    }, [albums]);

    // Filtering & Sorting Logic
    const filteredAlbums = useMemo(() => {
        let result = [...albums];

        // Filter by Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((a) => {
                const titleMatch = a.title.toLowerCase().includes(q);
                const artistStr = Array.isArray(a.artist)
                    ? a.artist.join(" ").toLowerCase()
                    : (a.artist || "").toLowerCase();
                const artistMatch = artistStr.includes(q);
                return titleMatch || artistMatch;
            });
        }

        // Filter by Format
        if (filterFormat !== "All") {
            result = result.filter((a) => {
                const formats = Array.isArray(a.format)
                    ? a.format
                    : [a.format || "Digital"];
                return formats.includes(filterFormat);
            });
        }

        // Filter by Status
        if (filterStatus !== "All") {
            result = result.filter(
                (a) => (a.status || "Collection") === filterStatus,
            );
        }

        // Filter by Artist
        if (filterArtist !== "All") {
            result = result.filter((a) => {
                let albumArtists = [];
                if (Array.isArray(a.artist)) {
                    albumArtists = a.artist;
                } else if (typeof a.artist === "string") {
                    if (a.artist.includes(";")) {
                        albumArtists = a.artist.split(";").map((p) => p.trim());
                    } else {
                        albumArtists = [a.artist];
                    }
                }
                return albumArtists.includes(filterArtist);
            });
        }

        // Filter by Year
        if (filterYear !== "All") {
            result = result.filter(
                (a) => a.releaseDate && a.releaseDate.startsWith(filterYear),
            );
        }

        // Filter by Genre
        if (filterGenre !== "All") {
            result = result.filter(
                (a) => a.genres && a.genres.includes(filterGenre),
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === "custom") {
                const orderA =
                    a.customOrder !== undefined ? a.customOrder : -a.addedAt;
                const orderB =
                    b.customOrder !== undefined ? b.customOrder : -b.addedAt;
                return orderA - orderB;
            }
            if (sortBy === "addedAt") return b.addedAt - a.addedAt;
            if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
            if (sortBy === "releaseDate")
                return (
                    new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0)
                );
            if (sortBy === "artist") {
                const artistA = Array.isArray(a.artist)
                    ? a.artist[0]
                    : a.artist;
                const artistB = Array.isArray(b.artist)
                    ? b.artist[0]
                    : b.artist;
                return (artistA || "").localeCompare(artistB || "");
            }
            if (sortBy === "title") return a.title.localeCompare(b.title);
            return 0;
        });

        return result;
    }, [
        albums,
        searchQuery,
        filterFormat,
        filterArtist,
        filterYear,
        filterGenre,
        filterStatus,
        sortBy,
    ]);

    // Grouping Logic
    const groupedAlbums = useMemo(() => {
        if (groupBy === "none") return null;

        const groups = {};

        filteredAlbums.forEach((album) => {
            let key = "Other";

            if (groupBy === "artist") {
                const primary = Array.isArray(album.artist)
                    ? album.artist[0]
                    : album.artist;
                key = primary || "Unknown Artist";
            } else if (groupBy === "year") {
                key = album.releaseDate
                    ? album.releaseDate.substring(0, 4)
                    : "Unknown Year";
            } else if (groupBy === "genre") {
                key =
                    album.genres && album.genres.length > 0
                        ? album.genres[0]
                        : "No Genre";
            } else if (groupBy === "format") {
                key =
                    (Array.isArray(album.format)
                        ? album.format[0]
                        : album.format) || "Digital";
            } else if (groupBy === "status") {
                key = album.status || "Collection";
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(album);
        });

        // Sort keys
        let sortedKeys = Object.keys(groups).sort();
        if (groupBy === "year") {
            sortedKeys = sortedKeys.reverse();
        }

        return sortedKeys.map((key) => ({
            title: key,
            albums: groups[key],
        }));
    }, [filteredAlbums, groupBy]);

    const handleClearFilters = () => {
        setFilterFormat("All");
        setFilterArtist("All");
        setFilterYear("All");
        setFilterGenre("All");
        setFilterStatus("All");
        setSearchQuery("");
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-emerald-500">
                <Loader2 size={48} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200">
            <AlbumDetailsModal
                isOpen={!!selectedAlbum}
                album={selectedAlbum}
                onClose={() => setSelectedAlbum(null)}
            />

            <PublicHeader />

            <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6 pb-24">
                {/* Toolbar */}
                <div className="mb-4 flex flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="relative flex-1 min-w-0">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search this collection..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 rounded-lg bg-neutral-900 border border-neutral-800 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex h-10 items-center rounded-lg border border-neutral-800 bg-neutral-900 p-1 shrink-0">
                            <FilterPanel
                                filterFormat={filterFormat}
                                setFilterFormat={setFilterFormat}
                                filterArtist={filterArtist}
                                setFilterArtist={setFilterArtist}
                                filterGenre={filterGenre}
                                setFilterGenre={setFilterGenre}
                                filterYear={filterYear}
                                setFilterYear={setFilterYear}
                                filterStatus={filterStatus}
                                setFilterStatus={setFilterStatus}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                uniqueArtists={uniqueArtists}
                                uniqueGenres={uniqueGenres}
                                uniqueYears={uniqueYears}
                                onClearAll={handleClearFilters}
                            />
                        </div>

                        <div className="flex h-10 items-center rounded-lg border border-neutral-800 bg-neutral-900 p-1 shrink-0">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className={`flex items-center gap-2 rounded px-2 py-1 text-sm font-medium transition-colors cursor-pointer ${
                                            groupBy !== "none"
                                                ? "bg-neutral-800 text-white"
                                                : "text-neutral-500 hover:text-neutral-300"
                                        }`}
                                    >
                                        <Layers size={16} />
                                        <span className="hidden sm:inline">
                                            Group
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-48 p-2 bg-neutral-900 border-neutral-800"
                                    align="end"
                                >
                                    <div className="grid gap-1">
                                        <h4 className="font-medium text-xs text-neutral-500 mb-2 px-2 uppercase">
                                            Group By
                                        </h4>
                                        {[
                                            "none",
                                            "artist",
                                            "year",
                                            "genre",
                                            "format",
                                            "status",
                                        ].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setGroupBy(opt)}
                                                className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                                                    groupBy === opt
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "text-neutral-300 hover:bg-neutral-800"
                                                }`}
                                            >
                                                {opt.charAt(0).toUpperCase() +
                                                    opt.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex h-10 items-center rounded-lg border border-neutral-800 bg-neutral-900 p-1 shrink-0">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`rounded p-1.5 transition-colors cursor-pointer ${viewMode === "grid" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`rounded p-1.5 transition-colors cursor-pointer ${viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {filteredAlbums.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                        <Logo className="h-12 w-12 mb-4 opacity-20" />
                        <p>No albums found in this collection.</p>
                        {(searchQuery ||
                            filterFormat !== "All" ||
                            filterArtist !== "All") && (
                            <button
                                onClick={handleClearFilters}
                                className="mt-4 text-emerald-500 hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {groupBy === "none" ? (
                            // Flat View
                            viewMode === "grid" ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 p-2">
                                    {filteredAlbums.map((album) => (
                                        <AlbumCard
                                            key={album.id}
                                            album={album}
                                            onClick={() =>
                                                setSelectedAlbum(album)
                                            }
                                            readOnly={true}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredAlbums.map((album) => (
                                        <AlbumRow
                                            key={album.id}
                                            album={album}
                                            onClick={() =>
                                                setSelectedAlbum(album)
                                            }
                                            readOnly={true}
                                        />
                                    ))}
                                </div>
                            )
                        ) : (
                            // Grouped View
                            <div className="flex flex-col gap-8">
                                {groupedAlbums.map((group) => (
                                    <div key={group.title}>
                                        <h3 className="text-xl font-bold text-emerald-500 mb-4 px-2 border-b border-emerald-500/20 pb-2">
                                            {group.title}
                                            <span className="text-sm font-normal text-neutral-500 ml-2">
                                                ({group.albums.length})
                                            </span>
                                        </h3>
                                        {viewMode === "grid" ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 p-2">
                                                {group.albums.map((album) => (
                                                    <AlbumCard
                                                        key={album.id}
                                                        album={album}
                                                        onClick={() =>
                                                            setSelectedAlbum(
                                                                album,
                                                            )
                                                        }
                                                        readOnly={true}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {group.albums.map((album) => (
                                                    <AlbumRow
                                                        key={album.id}
                                                        album={album}
                                                        onClick={() =>
                                                            setSelectedAlbum(
                                                                album,
                                                            )
                                                        }
                                                        readOnly={true}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            <PublicBottomNav />
        </div>
    );
}
