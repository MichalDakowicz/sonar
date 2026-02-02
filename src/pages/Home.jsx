import { useState, useMemo, useRef, useEffect } from "react";
import Logo from "../components/ui/Logo";
import { useAuth } from "../features/auth/AuthContext";
import { useAlbums } from "../hooks/useAlbums";
import { useToast } from "../components/ui/Toast";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Link } from "react-router-dom";
import AlbumCard from "../features/albums/AlbumCard";
import AlbumRow from "../features/albums/AlbumRow";
import AddAlbumModal from "../features/albums/AddAlbumModal";
import EditAlbumModal from "../features/albums/EditAlbumModal";
import StatsModal from "../features/stats/StatsModal";
import ImportExportModal from "../features/settings/ImportExportModal";
import RandomSpinModal from "../features/albums/RandomSpinModal";
import { FilterPanel } from "../components/FilterPanel";
import {
    LogOut,
    Plus,
    LayoutGrid,
    List as ListIcon,
    Search,
    Shuffle,
    Layers,
    BarChart3,
    Clock,
    Database,
    Share2,
    Menu,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableAlbum({ album, viewMode, innerRef, disabled, ...props }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: album.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.5 : 1,
    };

    const Wrapper = "div";
    const Component = viewMode === "grid" ? AlbumCard : AlbumRow;

    return (
        <Wrapper
            ref={(node) => {
                setNodeRef(node);
                if (innerRef) innerRef(node);
            }}
            style={style}
            {...attributes}
            {...listeners}
            className={
                viewMode === "list"
                    ? "w-full touch-manipulation"
                    : "h-full touch-manipulation"
            }
        >
            <Component album={album} {...props} />
        </Wrapper>
    );
}

// Hook for persisted state
function usePersistedState(key, defaultValue) {
    const [state, setState] = useState(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue !== null
                ? JSON.parse(storedValue)
                : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}

export default function Home() {
    const { logout, user } = useAuth();
    const { albums, loading, addAlbum, updateAlbum, removeAlbum } = useAlbums();
    const { toast } = useToast();

    const [viewMode, setViewMode] = usePersistedState("mt_viewMode", "grid");
    const [groupBy, setGroupBy] = usePersistedState("mt_groupBy", "none");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [filterFormat, setFilterFormat] = usePersistedState(
        "mt_filterFormat",
        "All",
    );
    const [filterArtist, setFilterArtist] = usePersistedState(
        "mt_filterArtist",
        "All",
    );
    const [filterYear, setFilterYear] = usePersistedState(
        "mt_filterYear",
        "All",
    );
    const [filterGenre, setFilterGenre] = usePersistedState(
        "mt_filterGenre",
        "All",
    );
    const [filterStatus, setFilterStatus] = usePersistedState(
        "mt_filterStatus_v2",
        "All",
    );
    const [sortBy, setSortBy] = usePersistedState("mt_sortBy", "custom");

    const [highlightedAlbumId, setHighlightedAlbumId] = useState(null);

    // FnD States
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Map to store refs of album elements for scrolling
    const itemsRef = useRef(new Map());

    // Extract unique artists, years, and genres for filters
    const { uniqueArtists, uniqueYears, uniqueGenres } = useMemo(() => {
        const artists = new Set();
        const years = new Set();
        const genres = new Set();

        albums.forEach((album) => {
            // Normalize to array
            let albumArtists = [];
            if (Array.isArray(album.artist)) {
                albumArtists = album.artist;
            } else if (typeof album.artist === "string") {
                // Fallback for legacy data: split by semicolon if present
                if (album.artist.includes(";")) {
                    albumArtists = album.artist.split(";").map((a) => a.trim());
                } else {
                    // Otherwise treat as single artist (even if it has a comma)
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

    // Derived state for filtered albums
    const filteredAlbums = useMemo(() => {
        let result = [...albums];

        // Filter by Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((a) => {
                const titleMatch = a.title.toLowerCase().includes(q);
                // Handle search for both string and array artists
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

        // Filter by Status (Default to just "Collection" if "All" is not explicit, but here user selects status)
        if (filterStatus !== "All") {
            // Legacy albums didn't have status, so assume "Collection" for undefined
            result = result.filter(
                (a) => (a.status || "Collection") === filterStatus,
            );
        }

        // Filter by Artist
        if (filterArtist !== "All") {
            result = result.filter((a) => {
                // Normalize checking
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
                // Sort by first artist in list
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

    // Albums eligible for random spin (only Collection)
    const validSpinAlbums = useMemo(() => {
        return filteredAlbums.filter(a => a.status === 'Collection');
    }, [filteredAlbums]);

    // Derived state for grouped albums
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
                 key = (album.genres && album.genres.length > 0) ? album.genres[0] : "No Genre";
            } else if (groupBy === "format") {
                 key = (Array.isArray(album.format) ? album.format[0] : album.format) || "Digital";
            } else if (groupBy === "status") {
                 key = album.status || "Collection";
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(album);
        });

        // Sort keys
        let sortedKeys = Object.keys(groups).sort();
        
        // Reverse sort for years (newest first)
        if (groupBy === "year") {
            sortedKeys = sortedKeys.reverse();
        }

        return sortedKeys.map((key) => ({
            title: key,
            albums: groups[key],
        }));
    }, [filteredAlbums, groupBy]);

    const isReorderEnabled =
        sortBy === "custom" &&
        groupBy === "none" &&
        !searchQuery &&
        filterFormat === "All" &&
        filterArtist === "All" &&
        filterYear === "All" &&
        filterGenre === "All";
    // Allowing reorder even if status is Wishlist if user wants,
    // but typically users strictly reorder their Collection.
    // For now, allow it if it is the only active filter (user selected a specific status or All).

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over.id) {
            const oldIndex = filteredAlbums.findIndex(
                (item) => item.id === active.id,
            );
            const newIndex = filteredAlbums.findIndex(
                (item) => item.id === over.id,
            );

            if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(filteredAlbums, oldIndex, newIndex);
                const prevItem = newItems[newIndex - 1];
                const nextItem = newItems[newIndex + 1];

                const getOrder = (a) =>
                    a.customOrder !== undefined ? a.customOrder : -a.addedAt;

                let newOrder;
                // Large gap of 100000 ensures plenty of space.
                // Timestamps are huge (1700000000000), so 100000 is small relative to timestamp,
                // but if we use customOrder that started from -timestamp, the magnitude is same.
                // We need to be careful about precision with floating points, but JS numbers are doubles (64-bit float),
                // so they have 53 bits of significand.
                // 2^53 is ~9e15. Timestamps are 1.7e12. We have plenty of precision for division.

                if (!prevItem) {
                    newOrder = getOrder(nextItem) - 100000;
                } else if (!nextItem) {
                    newOrder = getOrder(prevItem) + 100000;
                } else {
                    newOrder = (getOrder(prevItem) + getOrder(nextItem)) / 2;
                }

                updateAlbum(active.id, { customOrder: newOrder });
            }
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    // Effect to handle scrolling when highlightedAlbumId changes
    useEffect(() => {
        if (highlightedAlbumId) {
            const node = itemsRef.current.get(highlightedAlbumId);
            if (node) {
                node.scrollIntoView({ behavior: "smooth", block: "center" });
                // Optional: Remove highlight after a delay?
                // For now we keep it until user clicks something else or picks new random
            }
        }
    }, [highlightedAlbumId]);

    const handleRandomPick = () => {
        if (validSpinAlbums.length === 0) {
             toast({ 
                title: "No Albums to Spin", 
                description: "No 'Collection' albums match your current filters.", 
                variant: "destructive" 
             });
             return;
        }
        setIsSpinModalOpen(true);
    };

    const handleClearFilters = () => {
        setFilterFormat("All");
        setFilterArtist("All");
        setFilterYear("All");
        setFilterGenre("All");
        setFilterStatus("All");
        setSearchQuery("");
    };

    const handleShareShelf = () => {
        if (!user) return;
        const url = `${window.location.origin}/u/${user.uid}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied!",
            description: "Public shelf link copied to your clipboard.",
            variant: "default",
        });
    };

    return (
        <div
            className="min-h-screen bg-neutral-950 text-neutral-200"
            onClick={() => setHighlightedAlbumId(null)}
        >
            {/* Header */}
            <header
                className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto max-w-screen-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                            <Logo className="h-8 w-8 text-emerald-500" />
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                Sonar
                            </h1>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Mobile View: Add Album & Menu */}
                        <div className="flex sm:hidden items-center gap-2">
                             <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 rounded-full bg-white p-2 text-sm font-bold text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                <Plus size={20} />
                            </button>
            
                            <Popover open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                <PopoverTrigger asChild>
                                     <button className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer">
                                        <Menu size={20} />
                                     </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 bg-neutral-950 border-neutral-800 p-2" align="end">
                                    <div className="flex flex-col gap-1">
                                         <button
                                            onClick={() => {
                                                setIsStatsModalOpen(true);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer w-full text-left"
                                        >
                                            <BarChart3 size={16} />
                                            <span>Overview</span>
                                        </button>
                                         <Link
                                            to="/history"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer w-full text-left"
                                        >
                                            <Clock size={16} />
                                            <span>History</span>
                                        </Link>
                                         <button
                                            onClick={() => {
                                                handleRandomPick();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer w-full text-left"
                                        >
                                            <Shuffle size={16} />
                                            <span>Pick Random</span>
                                        </button>
                                         <button
                                            onClick={() => {
                                                setIsImportModalOpen(true);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer w-full text-left"
                                        >
                                            <Database size={16} />
                                            <span>Import/Export</span>
                                        </button>
                                         <button
                                            onClick={handleShareShelf}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer w-full text-left"
                                        >
                                            <Share2 size={16} />
                                            <span>Share</span>
                                        </button>
                                         <div className="h-px bg-neutral-800 my-1" />
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-800 text-neutral-300 hover:text-red-400 transition-colors cursor-pointer w-full text-left"
                                        >
                                            <LogOut size={16} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Desktop View: Full Toolbar */}
                        <div className="hidden sm:flex items-center gap-4">
                            <button
                                onClick={handleRandomPick}
                                className="flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-800 hover:text-emerald-400 transition-colors cursor-pointer"
                            >
                                <Shuffle size={16} />
                                <span className="hidden sm:inline">
                                    Pick Random
                                </span>
                            </button>
    
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Add Album</span>
                            </button>

                            <button
                                onClick={() => setIsStatsModalOpen(true)}
                                className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                                title="Overview"
                            >
                                <BarChart3 size={20} />
                            </button>
    
                            <Link
                                to="/history"
                                className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                                title="History"
                            >
                                <Clock size={20} />
                            </Link>
    
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                                title="Import/Export Data"
                            >
                                <Database size={20} />
                            </button>
    
                            <button
                                onClick={handleShareShelf}
                                className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                                title="Share Public Link"
                            >
                                <Share2 size={20} />
                            </button>
    
                            <div className="h-6 w-px bg-neutral-800" />
    
                            <button
                                onClick={logout}
                                className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main
                className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Toolbar */}
                <div className="mb-4 flex flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="relative flex-1 min-w-0">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search library..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 rounded-lg bg-neutral-900 border border-neutral-800 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                    <button className={`flex items-center gap-2 rounded px-2 py-1 text-sm font-medium transition-colors cursor-pointer ${
                                        groupBy !== "none" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
                                    }`}>
                                        <Layers size={16} />
                                        <span className="hidden sm:inline">Group</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2 bg-neutral-900 border-neutral-800" align="end">
                                    <div className="grid gap-1">
                                        <h4 className="font-medium text-xs text-neutral-500 mb-2 px-2 uppercase">Group By</h4>
                                        {["none", "artist", "year", "genre", "format", "status"].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setGroupBy(opt)}
                                                className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                                                    groupBy === opt ? "bg-emerald-500/10 text-emerald-500" : "text-neutral-300 hover:bg-neutral-800"
                                                }`}
                                            >
                                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`rounded p-1.5 transition-colors cursor-pointer ${viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                                title="List View"
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    {loading ? (
                        <div className="flex h-64 items-center justify-center text-neutral-500">
                            Loading collection...
                        </div>
                    ) : filteredAlbums.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-900/50 text-neutral-500">
                            <p className="mb-4">No albums found.</p>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="text-emerald-500 hover:underline"
                            >
                                Add your first album
                            </button>
                        </div>
                    ) : groupedAlbums ? (
                        <div className="flex flex-col gap-8 pb-20">
                            {groupedAlbums.map((group) => (
                                <div key={group.title}>
                                    <h2 className="text-xl font-bold text-white mb-4 pl-2 flex items-center gap-2">
                                        <div className="h-5 w-1 bg-emerald-500 rounded-full" />
                                        {group.title}
                                        <span className="text-sm font-normal text-neutral-500">
                                            ({group.albums.length})
                                        </span>
                                    </h2>
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-2">
                                            {group.albums.map((album) => (
                                                <AlbumCard
                                                    key={album.id}
                                                    album={album}
                                                    onClick={() =>
                                                        setEditingAlbum(album)
                                                    }
                                                    isHighlighted={
                                                        highlightedAlbumId ===
                                                        album.id
                                                    }
                                                    innerRef={(node) => {
                                                        const map =
                                                            itemsRef.current;
                                                        if (node)
                                                            map.set(
                                                                album.id,
                                                                node,
                                                            );
                                                        else
                                                            map.delete(
                                                                album.id,
                                                            );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {group.albums.map((album) => (
                                                <AlbumRow
                                                    key={album.id}
                                                    album={album}
                                                    onClick={() =>
                                                        setEditingAlbum(album)
                                                    }
                                                    isHighlighted={
                                                        highlightedAlbumId ===
                                                        album.id
                                                    }
                                                    innerRef={(node) => {
                                                        const map =
                                                            itemsRef.current;
                                                        if (node)
                                                            map.set(
                                                                album.id,
                                                                node,
                                                            );
                                                        else
                                                            map.delete(
                                                                album.id,
                                                            );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <SortableContext
                            items={filteredAlbums.map((a) => a.id)}
                            strategy={
                                viewMode === "grid"
                                    ? rectSortingStrategy
                                    : verticalListSortingStrategy
                            }
                            disabled={!isReorderEnabled}
                        >
                            {viewMode === "grid" ? (
                                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-2 pb-20">
                                    {filteredAlbums.map((album) => (
                                        <SortableAlbum
                                            key={album.id}
                                            album={album}
                                            viewMode="grid"
                                            onClick={() =>
                                                setEditingAlbum(album)
                                            }
                                            isHighlighted={
                                                highlightedAlbumId === album.id
                                            }
                                            innerRef={(node) => {
                                                const map = itemsRef.current;
                                                if (node) {
                                                    map.set(album.id, node);
                                                } else {
                                                    map.delete(album.id);
                                                }
                                            }}
                                            disabled={!isReorderEnabled}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 pb-20">
                                    {filteredAlbums.map((album) => (
                                        <SortableAlbum
                                            key={album.id}
                                            album={album}
                                            viewMode="list"
                                            onClick={() =>
                                                setEditingAlbum(album)
                                            }
                                            isHighlighted={
                                                highlightedAlbumId === album.id
                                            }
                                            innerRef={(node) => {
                                                const map = itemsRef.current;
                                                if (node) {
                                                    map.set(album.id, node);
                                                } else {
                                                    map.delete(album.id);
                                                }
                                            }}
                                            disabled={!isReorderEnabled}
                                        />
                                    ))}
                                </div>
                            )}
                        </SortableContext>
                    )}

                    <DragOverlay adjustScale={true}>
                        {activeId
                            ? (() => {
                                  const album = albums.find(
                                      (a) => a.id === activeId,
                                  );
                                  if (!album) return null;
                                  return viewMode === "grid" ? (
                                      <div className="h-full touch-manipulation">
                                          <AlbumCard
                                              album={album}
                                              isHighlighted={true}
                                              readOnly
                                          />
                                      </div>
                                  ) : (
                                      <div className="w-full touch-manipulation">
                                          <AlbumRow
                                              album={album}
                                              isHighlighted={true}
                                          />
                                      </div>
                                  );
                              })()
                            : null}
                    </DragOverlay>
                </DndContext>
            </main>

            <AddAlbumModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={addAlbum}
            />

            <EditAlbumModal
                isOpen={!!editingAlbum}
                onClose={() => setEditingAlbum(null)}
                album={editingAlbum}
                onUpdate={updateAlbum}
                onDelete={removeAlbum}
            />

            <ImportExportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                albums={albums}
                addAlbum={addAlbum}
                removeAlbum={removeAlbum}
            />

            <StatsModal
                isOpen={isStatsModalOpen}
                onClose={() => setIsStatsModalOpen(false)}
                albums={albums}
            />

            <RandomSpinModal
                isOpen={isSpinModalOpen}
                onClose={() => setIsSpinModalOpen(false)}
                albums={validSpinAlbums}
                onSelect={(id) => {
                    setHighlightedAlbumId(id);
                    // Optionally scroll to it after modal closes?
                }}
            />
        </div>
    );
}
