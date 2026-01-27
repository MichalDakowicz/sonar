import { useState } from 'react';
import { X, Download, Upload, Loader2, CheckCircle, AlertCircle, FileJson, FileSpreadsheet } from 'lucide-react';
import { fetchAlbumMetadata } from '../../services/spotify';

export default function ImportExportModal({ isOpen, onClose, albums, addAlbum, removeAlbum }) {
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importLog, setImportLog] = useState([]); // { status: 'success'|'error', message: string }
  const [showOtherItems, setShowOtherItems] = useState(false);

  // Filter count to match Stats/Home view (owned albums only)
  const collectionAlbums = albums.filter(a => !a.status || a.status === 'Collection');
  const collectionCount = collectionAlbums.length;
  const otherAlbums = albums.filter(a => a.status && a.status !== 'Collection');

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(albums, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `music_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Artist', 'Year', 'Format', 'Status', 'Rating', 'SpotifyURL'];
    const rows = albums.map(a => [
        `"${(a.title || "").replace(/"/g, '""')}"`,
        `"${(Array.isArray(a.artist) ? a.artist.join(", ") : (a.artist || "")).replace(/"/g, '""')}"`,
        a.releaseDate || "",
        a.format || "",
        a.status || "",
        a.rating || "",
        a.url || ""
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `music_tracker_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;

    setIsImporting(true);
    setImportLog([]);
    const lines = importText.split('\n').filter(l => l.trim());
    
    const logs = [];
    
    for (const line of lines) {
        try {
            // Basic validation
            if (!line.includes('spotify.com') && !line.includes('spotify:album:')) {
                throw new Error("Not a recognized Spotify URL/URI");
            }

            const metadata = await fetchAlbumMetadata(line.trim());
            
            // Check for potential duplicates
            const isDuplicate = albums.some(a => a.spotifyId === metadata.spotifyId || a.title.toLowerCase() === metadata.title.toLowerCase());
            if (isDuplicate) {
                 logs.push({ status: 'error', message: `Skipped Duplicate: ${metadata.title}` });
                 continue;
            }
            
            await addAlbum({
                ...metadata,
                status: 'Collection',
                format: 'Digital', // Default for import
                addedAt: Date.now()
            });
            
            logs.push({ status: 'success', message: `Imported: ${metadata.title}` });
        } catch (err) {
            logs.push({ status: 'error', message: `Failed: ${line.substring(0, 40)}... - ${err.message}` });
        }
        // Update log progressively so user sees movement
        setImportLog([...logs]);
    }
    
    setIsImporting(false);
    if (logs.every(l => l.status === 'success')) {
        setImportText(""); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-6">
          <h2 className="text-xl font-bold text-white">Data Management</h2>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800">
          <button 
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'export' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-neutral-400 hover:text-white'}`}
          >
            Export Data
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'import' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-neutral-400 hover:text-white'}`}
          >
            Batch Import
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'export' ? (
                <div className="space-y-6">
                    <div>
                        <p className="text-neutral-400">
                            Download a backup of your entire library. You currently have <span className="text-white font-bold">{collectionCount}</span> albums in your collection (plus {otherAlbums.length} wishlist/other).
                        </p>
                        {otherAlbums.length > 0 && (
                            <button 
                                onClick={() => setShowOtherItems(!showOtherItems)}
                                className="text-sm text-emerald-500 hover:underline mt-2 flex items-center gap-1"
                            >
                                {showOtherItems ? 'Hide' : 'Review'} Non-Collection Items ({otherAlbums.length})
                            </button>
                        )}
                        
                        {showOtherItems && otherAlbums.length > 0 && (
                             <div className="mt-3 p-3 rounded-lg bg-black/40 border border-neutral-800 space-y-2 max-h-40 overflow-y-auto">
                                {otherAlbums.map(album => (
                                    <div key={album.id} className="flex items-center justify-between text-sm group">
                                        <div className="truncate text-neutral-300">
                                            <span className="font-bold">{album.title}</span> <span className="text-neutral-500">- {Array.isArray(album.artist) ? album.artist.join(", ") : album.artist}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">{album.status}</span>
                                            {removeAlbum && (
                                                <button 
                                                    onClick={() => {
                                                        if(confirm(`Permanently delete "${album.title}"?`)) removeAlbum(album.id);
                                                    }}
                                                    className="text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    title="Delete permanently"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                        <button 
                            onClick={handleExportJSON}
                            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:border-emerald-500/50 group transition-all"
                        >
                            <div className="p-3 rounded-full bg-neutral-900 text-emerald-500 group-hover:scale-110 transition-transform">
                                <FileJson size={32} />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-white mb-1">JSON Backup</div>
                                <div className="text-xs text-neutral-500">Full data structure. Best for restoring later.</div>
                            </div>
                        </button>

                         <button 
                            onClick={handleExportCSV}
                            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:border-blue-500/50 group transition-all"
                        >
                            <div className="p-3 rounded-full bg-neutral-900 text-blue-500 group-hover:scale-110 transition-transform">
                                <FileSpreadsheet size={32} />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-white mb-1">CSV Export</div>
                                <div className="text-xs text-neutral-500">Excel/Spreadsheet compatible.</div>
                            </div>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 h-full flex flex-col">
                    <div className="space-y-2">
                        <h3 className="text-white font-medium">Add Multiple Albums</h3>
                        <p className="text-sm text-neutral-400">
                            Paste a list of Spotify Album URLs (one per line) to batch import them into your collection.
                        </p>
                    </div>

                    <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder={'https://open.spotify.com/album/...\nhttps://open.spotify.com/album/...\nspotify:album:123...'}
                        className="w-full h-40 rounded-lg bg-neutral-950 border border-neutral-800 p-4 text-sm font-mono text-neutral-300 focus:border-emerald-500 focus:outline-none resize-none"
                    />

                    <button 
                        onClick={handleImport}
                        disabled={isImporting || !importText.trim()}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        {isImporting ? 'Importing...' : 'Start Import'}
                    </button>

                    {/* Logs */}
                    {importLog.length > 0 && (
                        <div className="mt-4 rounded-lg bg-black/50 border border-neutral-800 p-4 max-h-40 overflow-y-auto text-xs font-mono">
                            {importLog.map((log, i) => (
                                <div key={i} className={`flex items-start gap-2 mb-1 last:mb-0 ${log.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {log.status === 'success' ? <CheckCircle size={12} className="mt-0.5 shrink-0" /> : <AlertCircle size={12} className="mt-0.5 shrink-0" />}
                                    <span>{log.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
