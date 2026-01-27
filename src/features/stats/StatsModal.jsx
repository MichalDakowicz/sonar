import { useMemo } from "react";
import { X, BarChart3, PieChart, Calendar, Star, Disc, Trophy } from "lucide-react";

export default function StatsModal({ isOpen, onClose, albums }) {
  const stats = useMemo(() => {
    if (!albums || albums.length === 0) return null;

    // Filter to only include items in the Collection (exclude Wishlist/Pre-order)
    const collectionAlbums = albums.filter(a => !a.status || a.status === 'Collection');
    const totalAlbums = collectionAlbums.length;
    
    // Formats Breakdown (Flattening array formats)
    const formatCounts = {};
    collectionAlbums.forEach(album => {
        let raw = album.format;
        // Normalize to array
        let fmts = Array.isArray(raw) ? raw : [raw || "Digital"];
        
        // Deduplicate and sanitize
        const unique = new Set(
            fmts.map(f => (f ? String(f).trim() : "Digital"))
        );
        
        unique.forEach(f => {
            formatCounts[f] = (formatCounts[f] || 0) + 1;
        });
    });
    const sortedFormats = Object.entries(formatCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count, percent: totalAlbums > 0 ? Math.round((count / totalAlbums) * 100) : 0 }));

    // Artists
    const artistCounts = {};
    collectionAlbums.forEach(album => {
        const arts = Array.isArray(album.artist) ? album.artist : [album.artist];
        arts.forEach(a => {
            if(a) {
                const cleanName = String(a).trim();
                artistCounts[cleanName] = (artistCounts[cleanName] || 0) + 1;
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
    collectionAlbums.forEach(album => {
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

    // Ratings
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 0: 0 };
    collectionAlbums.forEach(album => {
        const r = album.rating || 0;
        ratingCounts[r] = (ratingCounts[r] || 0) + 1;
    });
    // Filter out 0 (unrated) for the chart, but maybe show count somewhere
    const sortedRatings = Object.entries(ratingCounts)
        .filter(([r]) => r !== "0")
        .map(([r, count]) => ({ rating: r, count }));

    return { totalAlbums, sortedFormats, topArtists, uniqueArtistCount, sortedDecades, sortedRatings, unratedCount: ratingCounts[0] };
  }, [albums]);

  if (!isOpen || !stats) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-emerald-500" /> Collection Insights
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
            
            {/* Top Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Albums" value={stats.totalAlbums} icon={<Disc size={20} />} />
                <StatCard label="Unique Artists" value={stats.uniqueArtistCount} icon={<Trophy size={20} />} /> 
                 <StatCard label="Most Popular Format" value={stats.sortedFormats[0]?.name || "N/A"} subtext={stats.sortedFormats[0] && `${stats.sortedFormats[0].count} albums`} icon={<PieChart size={20} />} />
                 <StatCard label="Top Decade" value={stats.sortedDecades.sort((a,b) => b.count - a.count)[0]?.decade || "N/A"} icon={<Calendar size={20} />} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Format Breakdown */}
                <div className="bg-neutral-950/50 rounded-xl p-5 border border-neutral-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Disc size={18} className="text-blue-500" /> Format Breakdown
                    </h3>
                    <div className="space-y-3">
                        {stats.sortedFormats.map((item) => (
                            <div key={item.name} className="relative">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white font-medium">{item.name}</span>
                                    <span className="text-neutral-400">{item.count} ({item.percent}%)</span>
                                </div>
                                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.percent}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Artists */}
                <div className="bg-neutral-950/50 rounded-xl p-5 border border-neutral-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-emerald-500" /> Top Artists
                    </h3>
                    <div className="space-y-3">
                        {stats.topArtists.map((item, index) => {
                            const max = stats.topArtists[0].count;
                            const percent = (item.count / max) * 100;
                            return (
                                <div key={item.name} className="relative">
                                     <div className="flex justify-between text-sm mb-1">
                                        <span className="text-white font-medium truncate pr-4">{index + 1}. {item.name}</span>
                                        <span className="text-neutral-400 shrink-0">{item.count}</span>
                                    </div>
                                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

             {/* Charts Row 2 */}
             <div className="grid md:grid-cols-2 gap-8">
                 {/* Rating Distribution */}
                 <div className="bg-neutral-950/50 rounded-xl p-5 border border-neutral-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Star size={18} className="text-yellow-400" /> Ratings
                    </h3>
                    <div className="flex items-end gap-2 h-40 pt-4">
                        {[1, 2, 3, 4, 5].map(rating => {
                            const data = stats.sortedRatings.find(r => r.rating == rating);
                            const count = data ? data.count : 0;
                            const max = Math.max(...stats.sortedRatings.map(r => r.count), 1);
                            const heightPercent = (count / max) * 100;
                            
                            return (
                                <div key={rating} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
                                    <div className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity mb-auto">{count}</div>
                                    <div 
                                        className="w-full bg-neutral-800 hover:bg-yellow-500/80 transition-colors rounded-t-sm relative group"
                                        style={{ height: `${heightPercent || 2}%` }}
                                    ></div>
                                    <span className="text-sm font-bold text-neutral-300">{rating}★</span>
                                </div>
                            )
                        })}
                    </div>
                    <p className="text-xs text-center text-neutral-500 mt-4">
                        {stats.unratedCount} unrated albums
                    </p>
                </div>

                {/* Decades */}
                <div className="bg-neutral-950/50 rounded-xl p-5 border border-neutral-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                         <Calendar size={18} className="text-purple-500" /> By Decade
                    </h3>
                    <div className="flex items-end gap-2 h-48 pt-4 pb-2 overflow-x-auto overflow-y-hidden custom-scrollbar">
                         {stats.sortedDecades.map(item => {
                            const max = Math.max(...stats.sortedDecades.map(d => d.count), 1);
                            const heightPercent = (item.count / max) * 100;

                             return (
                                <div key={item.decade} className="flex-1 flex flex-col items-center justify-end h-full gap-2 min-w-[40px] group">
                                    <div className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity mb-auto">{item.count}</div>
                                     <div 
                                        className="w-full bg-neutral-800 hover:bg-purple-500/80 transition-colors rounded-t-sm"
                                        style={{ height: `${heightPercent || 2}%` }}
                                    ></div>
                                    <span className="text-xs font-bold text-neutral-300 -rotate-45 origin-left translate-y-1">{item.decade}</span>
                                </div>
                             )
                         })}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, icon }) {
    return (
        <div className="bg-neutral-800/50 border border-neutral-800 rounded-lg p-4 flex flex-col items-center text-center hover:bg-neutral-800 transition-colors">
            <div className="mb-2 text-neutral-400">{icon}</div>
            <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</div>
            {subtext && <div className="text-xs text-emerald-500 mt-1">{subtext}</div>}
        </div>
    )
}
