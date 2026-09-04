import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
    BarChart3,
    PieChart,
    Calendar,
    Trophy,
    Library,
    Disc,
    DollarSign,
    Tags,
    Store,
    TrendingUp,
    ArrowLeft,
    LayoutGrid,
    LogOut,
    Home as HomeIcon,
    LogIn,
    Users,
} from "lucide-react";
import { useAlbums } from "../hooks/useAlbums";
import { usePublicAlbums } from "../hooks/usePublicAlbums";
import { useUserProfile } from "../hooks/useUserProfile";
import { useFriendVisibility } from "../hooks/useFriendVisibility";
import { Navbar } from "../components/layout/Navbar";
import { PublicBottomNav } from "../components/layout/PublicBottomNav";
import { PublicHeader } from "../components/layout/PublicHeader";
import Logo from "../components/ui/Logo";
import { useAuth } from "../features/auth/AuthContext";

export default function Stats() {
    const { userId } = useParams();
    const { user, login, logout } = useAuth();


    const { albums: userAlbums, loading: userLoading } = useAlbums();
    const { albums: publicAlbums, loading: publicLoading } =
        usePublicAlbums(userId);
    const { profile, loading: profileLoading } = useUserProfile(userId);
    const { showFriends } = useFriendVisibility(userId);

    const albums = userId ? publicAlbums : userAlbums;
    const loading = userId ? publicLoading : userLoading;

    // ... existing code ...


    const stats = useMemo(() => {
        if (!albums || albums.length === 0) return null;

        // Filter to only include items in the Collection (exclude Wishlist/Pre-order)
        const collectionAlbums = albums.filter(
            (a) => !a.status || a.status === "Collection",
        );
        const totalAlbums = collectionAlbums.length;

        // Formats Breakdown (Flattening array formats)
        const formatCounts = {};
        collectionAlbums.forEach((album) => {
            let raw = album.format;
            // Normalize to array
            let fmts = Array.isArray(raw) ? raw : [raw || "Digital"];

            // Deduplicate and sanitize
            const unique = new Set(
                fmts.map((f) => (f ? String(f).trim() : "Digital")),
            );

            unique.forEach((f) => {
                formatCounts[f] = (formatCounts[f] || 0) + 1;
            });
        });
        const sortedFormats = Object.entries(formatCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({
                name,
                count,
                percent:
                    totalAlbums > 0
                        ? Math.round((count / totalAlbums) * 100)
                        : 0,
            }));

        // Artists
        const artistCounts = {};
        collectionAlbums.forEach((album) => {
            const arts = Array.isArray(album.artist)
                ? album.artist
                : [album.artist];
            arts.forEach((a) => {
                if (a) {
                    const cleanName = String(a).trim();
                    artistCounts[cleanName] =
                        (artistCounts[cleanName] || 0) + 1;
                }
            });
        });
        const uniqueArtistCount = Object.keys(artistCounts).length;

        const topArtists = Object.entries(artistCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Decades
        const decadeCounts = {};
        collectionAlbums.forEach((album) => {
            if (album.releaseDate && album.releaseDate.length >= 4) {
                const year = parseInt(album.releaseDate.substring(0, 4));
                if (!isNaN(year)) {
                    const decade = Math.floor(year / 10) * 10;
                    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
                }
            }
        });
        const sortedDecades = Object.entries(decadeCounts)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([decade, count]) => ({ decade: `${decade}s`, count }));

        // Price & Value
        let totalValue = 0;
        const albumsWithPrice = [];
        collectionAlbums.forEach((album) => {
            const p = parseFloat(album.pricePaid);
            if (!isNaN(p) && p > 0) {
                totalValue += p;
                albumsWithPrice.push({ ...album, price: p });
            }
        });
        const mostExpensive = albumsWithPrice
            .sort((a, b) => b.price - a.price)
            .slice(0, 5);

        // Genres
        const genreCounts = {};
        collectionAlbums.forEach((album) => {
            if (album.genres && Array.isArray(album.genres)) {
                album.genres.forEach((g) => {
                    const clean = g.trim();
                    if (clean)
                        genreCounts[clean] = (genreCounts[clean] || 0) + 1;
                });
            }
        });
        const topGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                count,
                percent:
                    totalAlbums > 0
                        ? Math.round((count / totalAlbums) * 100)
                        : 0,
            }));

        // Stores
        const storeCounts = {};
        collectionAlbums.forEach((album) => {
            if (album.storeName) {
                const clean = album.storeName.trim();
                if (clean) storeCounts[clean] = (storeCounts[clean] || 0) + 1;
            }
        });
        const topStores = Object.entries(storeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            totalAlbums,
            sortedFormats,
            topArtists,
            uniqueArtistCount,
            sortedDecades,
            totalValue,
            mostExpensive,
            topGenres,
            topStores,
        };
    }, [albums]);

    // PublicHeader removed - using import

    if (loading)
        return (
            <div className="min-h-screen bg-neutral-950 text-white">
                {userId ? <PublicHeader /> : <Navbar />}
                <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6 pb-20 flex items-center justify-center">
                    <p>Loading stats...</p>
                </main>
                {userId && <PublicBottomNav />}
            </div>
        );
    
    if (!stats)
        return (
            <div className="min-h-screen bg-neutral-950 text-white">
                 {userId ? <PublicHeader /> : <Navbar />}
                 <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6 pb-20 flex flex-col items-center justify-center gap-4">
                    <p>No data available. Add some albums to your collection!</p>
                    <Link to={userId ? `/u/${userId}` : "/"} className="text-emerald-500 hover:underline">
                        {userId ? "Go to Shelf" : "Go to Library"}
                    </Link>
                </main>
                {userId && <PublicBottomNav />}
            </div>
        );

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            {userId ? <PublicHeader /> : <Navbar />}
            <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6 pb-24 space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">

                    {/* Top Stats Cards */}
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-35">
                            <StatCard
                                label="Total Albums"
                                value={stats.totalAlbums}
                                icon={<Library size={20} />}
                            />
                        </div>
                        {stats.totalValue > 0 && (
                            <div className="flex-1 min-w-35">
                                <StatCard
                                    label="Total Value"
                                    value={`$${stats.totalValue}`}
                                    icon={
                                        <DollarSign
                                            size={20}
                                            className="text-emerald-500"
                                        />
                                    }
                                    subtext="Est. Cost"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-35">
                            <StatCard
                                label="Unique Artists"
                                value={stats.uniqueArtistCount}
                                icon={<Trophy size={20} />}
                            />
                        </div>
                        <div className="flex-1 min-w-35">
                            <StatCard
                                label="Top Format"
                                value={stats.sortedFormats[0]?.name || "N/A"}
                                subtext={
                                    stats.sortedFormats[0] &&
                                    `${stats.sortedFormats[0].count} albums`
                                }
                                icon={<PieChart size={20} />}
                            />
                        </div>
                        <div className="flex-1 min-w-35">
                            <StatCard
                                label="Top Decade"
                                value={
                                    stats.sortedDecades.sort(
                                        (a, b) => b.count - a.count,
                                    )[0]?.decade || "N/A"
                                }
                                icon={<Calendar size={20} />}
                            />
                        </div>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Format Breakdown */}
                        <div className="bg-neutral-900/40 rounded-3xl p-6 border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Disc size={20} className="text-blue-500" />{" "}
                                Format Breakdown
                            </h3>
                            <div className="space-y-4">
                                {stats.sortedFormats.map((item) => (
                                    <div
                                        key={item.name}
                                        className="relative group"
                                    >
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-white font-medium">
                                                {item.name}
                                            </span>
                                            <span className="text-neutral-400 group-hover:text-white transition-colors">
                                                {item.count}
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-linear-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                style={{
                                                    width: `${item.percent}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Artists */}
                        <div className="bg-neutral-900/40 rounded-3xl p-6 border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <BarChart3
                                    size={20}
                                    className="text-emerald-500"
                                />{" "}
                                Top Artists
                            </h3>
                            <div className="space-y-4">
                                {stats.topArtists.map((item, index) => {
                                    const max = stats.topArtists[0].count;
                                    const percent = (item.count / max) * 100;
                                    return (
                                        <div
                                            key={item.name}
                                            className="relative group"
                                        >
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-white font-medium truncate pr-4 flex items-center gap-2">
                                                    <span
                                                        className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${
                                                            index === 0
                                                                ? "bg-yellow-500/20 text-yellow-500"
                                                                : index === 1
                                                                ? "bg-slate-400/20 text-slate-300"
                                                                : index === 2
                                                                ? "bg-orange-500/20 text-orange-500"
                                                                : "bg-neutral-800 text-neutral-400"
                                                        }`}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                    {item.name}
                                                </span>
                                                <span className="text-neutral-400 shrink-0 group-hover:text-white transition-colors">
                                                    {item.count}
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-linear-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                    style={{
                                                        width: `${percent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Decades */}
                        <div
                            className={`bg-neutral-900/40 rounded-3xl p-6 border border-neutral-800/50 hover:border-neutral-700/50 transition-colors ${
                                stats.topGenres.length === 0
                                    ? "md:col-span-2"
                                    : ""
                            }`}
                        >
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Calendar
                                    size={20}
                                    className="text-purple-500"
                                />{" "}
                                By Decade
                            </h3>
                            <div className="flex items-end gap-3 h-56 pt-4 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
                                {stats.sortedDecades.map((item) => {
                                    const max = Math.max(
                                        ...stats.sortedDecades.map(
                                            (d) => d.count,
                                        ),
                                        1,
                                    );
                                    const heightPercent =
                                        (item.count / max) * 100;

                                    return (
                                        <div
                                            key={item.decade}
                                            className="flex-1 flex flex-col items-center justify-end h-full gap-2 min-w-12 group cursor-default"
                                        >
                                            <div className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity mb-auto font-mono bg-neutral-800 px-2 py-1 rounded">
                                                {item.count}
                                            </div>
                                            <div
                                                className="w-full bg-neutral-800 hover:bg-purple-500 transition-all duration-300 rounded-t-lg shadow-none hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                                                style={{
                                                    height: `${
                                                        heightPercent || 2
                                                    }%`,
                                                }}
                                            ></div>
                                            <span className="text-xs font-bold text-neutral-400 group-hover:text-white transition-colors -rotate-45 origin-left translate-y-1">
                                                {item.decade}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Genres */}
                        {stats.topGenres.length > 0 && (
                            <div className="bg-neutral-900/40 rounded-3xl p-6 border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Tags size={20} className="text-pink-500" />{" "}
                                    Top Genres
                                </h3>
                                <div className="space-y-4">
                                    {stats.topGenres.map((item) => (
                                        <div
                                            key={item.name}
                                            className="relative group"
                                        >
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-white font-medium capitalize">
                                                    {item.name}
                                                </span>
                                                <span className="text-neutral-400 group-hover:text-white transition-colors">
                                                    {item.count}
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-linear-to-r from-pink-600 to-pink-400 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                                                    style={{
                                                        width: `${item.percent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Charts Row 3 */}
                    {(stats.topStores.length > 0 ||
                        stats.mostExpensive.length > 0) && (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Top Stores */}
                            {stats.topStores.length > 0 && (
                                <div
                                    className={`bg-neutral-900/40 rounded-3xl p-6 border border-neutral-800/50 hover:border-neutral-700/50 transition-colors ${
                                        stats.mostExpensive.length === 0
                                            ? "md:col-span-2"
                                            : ""
                                    }`}
                                >
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Store
                                            size={20}
                                            className="text-orange-500"
                                        />{" "}
                                        Top Stores
                                    </h3>
                                    <div className="space-y-3">
                                        {stats.topStores.map((store, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg hover:bg-neutral-800/50 transition-colors"
                                            >
                                                <span className="text-white font-medium">
                                                    {store.name}
                                                </span>
                                                <span className="bg-neutral-800 text-neutral-400 text-xs px-2 py-1 rounded-full font-mono">
                                                    {store.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Most Expensive */}
                            {stats.mostExpensive.length > 0 && (
                                <div
                                    className={`bg-neutral-900/40 rounded-3xl p-6 border border-neutral-800/50 hover:border-neutral-700/50 transition-colors ${
                                        stats.topStores.length === 0
                                            ? "md:col-span-2"
                                            : ""
                                    }`}
                                >
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <TrendingUp
                                            size={20}
                                            className="text-emerald-500"
                                        />{" "}
                                        Most Valuable
                                    </h3>
                                    <div className="space-y-3">
                                        {stats.mostExpensive.map((album, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 p-2 bg-neutral-800/30 rounded-lg hover:bg-neutral-800/50 transition-colors group"
                                            >
                                                <div className="w-10 h-10 rounded overflow-hidden bg-neutral-900 shrink-0">
                                                    {album.coverUrl ? (
                                                        <img
                                                            src={album.coverUrl}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Disc className="p-2 text-neutral-700" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-bold text-white truncate group-hover:text-emerald-400 table-cell">
                                                        {album.title}
                                                    </div>
                                                    <div className="text-xs text-neutral-400 truncate">
                                                        {Array.isArray(
                                                            album.artist,
                                                        )
                                                            ? album.artist.join(
                                                                  ", ",
                                                              )
                                                            : album.artist}
                                                    </div>
                                                </div>
                                                <div className="text-emerald-400 font-mono font-bold">
                                                    ${album.price.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
            </main>
            {userId && <PublicBottomNav />}
        </div>
    );
}

function StatCard({ label, value, subtext, icon }) {

    return (
        <div className="h-full bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-neutral-800/60 transition-colors hover:scale-[1.02] duration-200 cursor-default">
            <div className="mb-3 text-neutral-400 bg-neutral-800/50 p-3 rounded-full">
                {icon}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                {label}
            </div>
            {subtext && (
                <div className="text-xs text-emerald-400 mt-2 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                    {subtext}
                </div>
            )}
        </div>
    );
}
