import { useState } from 'react';
import { X, Download, Upload, Loader2, CheckCircle, AlertCircle, FileJson, FileSpreadsheet } from 'lucide-react';
import { fetchAlbumMetadata } from '../../services/spotify';

export default function ImportExportModal({ isOpen, onClose, albums, addAlbum, removeAlbum }) {
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importLog, setImportLog] = useState([]); // { status: 'success'|'error', message: string }
  const [showOtherItems, setShowOtherItems] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    const headers = ['Title', 'Artist', 'Year', 'Format', 'Status', 'SpotifyURL'];
    const rows = albums.map(a => [
        `"${(a.title || "").replace(/"/g, '""')}"`,
        `"${(Array.isArray(a.artist) ? a.artist.join(", ") : (a.artist || "")).replace(/"/g, '""')}"`,
        a.releaseDate || "",
        a.format || "",
        a.status || "",
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
    
    const logs = [];
    const updateLogs = () => setImportLog([...logs]);

    // TRY JSON IMPORT FIRST
    try {
        const trimmed = importText.trim();
        // Heuristic: if it looks like JSON array, try to parse it strictly
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                let count = 0;
                for (const item of parsed) {
                    count++;
                    try {
                        if (!item.title || !item.artist) throw new Error("Missing title or artist");
                        
                        const normalizeArtist = (val) => {
                            if (Array.isArray(val)) return val.join(", ").toLowerCase();
                            return (val || "").toString().toLowerCase();
                        }

                        const isDuplicate = albums.some(a => 
                            (a.spotifyId && item.spotifyId && a.spotifyId === item.spotifyId) || 
                            (a.title.toLowerCase() === item.title.toLowerCase() && normalizeArtist(a.artist) === normalizeArtist(item.artist))
                        );
                        
                        if (isDuplicate) {
                            logs.push({ status: 'error', message: `Skipped Duplicate: ${item.title}` });
                        } else {
                            await addAlbum({
                                ...item,
                                addedAt: item.addedAt || Date.now(),
                            });
                            logs.push({ status: 'success', message: `Imported: ${item.title}` });
                        }
                    } catch(err) {
                        logs.push({ status: 'error', message: `Failed item: ${item.title || 'Unknown'} - ${err.message}` });
                    }
                    
                    // Update UI only every 10 items to prevent freezing
                    if (count % 10 === 0) updateLogs();
                }
                updateLogs();
                setIsImporting(false);
                if (logs.every(l => l.status === 'success')) setImportText(""); 
                return;
            }
        }
    } catch (e) {
        console.error("JSON Import failed, falling back to URL mode", e);
        // If it looked like JSON but failed to parse, warn the user instead of trying URLs
        if (importText.trim().startsWith('[')) {
             logs.push({ status: 'error', message: `Invalid JSON format: ${e.message}` });
             updateLogs();
             setIsImporting(false);
             return;
        }
    }

    // TRY CSV IMPORT
    const firstLine = importText.trim().split('\n')[0];
    const isCSV = firstLine && (firstLine.includes(',') || firstLine.toLowerCase().includes('title,artist')); // Simple Heuristic

    if (isCSV && !importText.includes('spotify.com') && !importText.includes('spotify:album:')) {
         try {
             // Simple CSV Parser
             const parseCSVLine = (line) => {
                 const result = [];
                 let startValueIndex = 0;
                 let inQuote = false;
                 
                 for (let i = 0; i < line.length; i++) {
                     if (line[i] === '"') {
                         inQuote = !inQuote;
                     } else if (line[i] === ',' && !inQuote) {
                         let val = line.substring(startValueIndex, i).trim();
                         // Unescape quotes
                         if (val.startsWith('"') && val.endsWith('"')) {
                             val = val.substring(1, val.length - 1).replace(/""/g, '"');
                         }
                         result.push(val);
                         startValueIndex = i + 1;
                     }
                 }
                 // Last value
                 let val = line.substring(startValueIndex).trim();
                 if (val.startsWith('"') && val.endsWith('"')) {
                     val = val.substring(1, val.length - 1).replace(/""/g, '"');
                 }
                 result.push(val);
                 
                 return result;
             };

             const lines = importText.trim().split('\n');
             // Assume first line is header if it contains 'Title'
             const headerStr = lines[0].toLowerCase();
             let startRow = 0;
             let colMap = { title: 0, artist: 1, year: 2, format: 3, status: 4, url: 5 }; // default indices based on export

             if (headerStr.includes('title') && headerStr.includes('artist')) {
                 const headers = parseCSVLine(lines[0].toLowerCase());
                 colMap = {
                     title: headers.indexOf('title'),
                     artist: headers.indexOf('artist'),
                     year: headers.indexOf('year'),
                     format: headers.indexOf('format'),
                     status: headers.indexOf('status'),
                     url: headers.indexOf('spotifyurl') > -1 ? headers.indexOf('spotifyurl') : headers.indexOf('url')
                 };
                 startRow = 1;
             }

             let count = 0;
             for (let i = startRow; i < lines.length; i++) {
                 count++;
                 if (!lines[i].trim()) continue;

                 try {
                     const cols = parseCSVLine(lines[i]);
                     const title = cols[colMap.title];
                     const artistStr = cols[colMap.artist];
                     
                     if (!title) continue;

                     // Normalize Artist
                     const artist = artistStr.includes(',') && !artistStr.includes(', ') ? artistStr.split(',') : [artistStr];


                     const normalizeArtist = (val) => {
                        if (Array.isArray(val)) return val.join(", ").toLowerCase();
                        return (val || "").toString().toLowerCase();
                     }

                     const isDuplicate = albums.some(a => 
                         (a.title.toLowerCase() === title.toLowerCase() && normalizeArtist(a.artist) === normalizeArtist(artist))
                     );
                     
                     if (isDuplicate) {
                         logs.push({ status: 'error', message: `Skipped Duplicate: ${title}` });
                     } else {
                        await addAlbum({
                             title,
                             artist,
                             releaseDate: cols[colMap.year] || "",
                             format: cols[colMap.format] || "Digital",
                             status: cols[colMap.status] || "Collection",
                             url: cols[colMap.url] || "",
                             addedAt: Date.now(),
                        });
                        logs.push({ status: 'success', message: `Imported: ${title}` });
                     }

                 } catch (err) {
                      logs.push({ status: 'error', message: `Failed Row ${i + 1}: ${err.message}` });
                 }
                 
                 if (count % 10 === 0) updateLogs();
             }
             
             updateLogs();
             setIsImporting(false);
             if (logs.every(l => l.status === 'success')) setImportText("");
             return;

         } catch (e) {
             console.error("CSV Import Failed", e);
             logs.push({ status: 'error', message: `CSV Parsing Error: ${e.message}` });
         }
    }

    const lines = importText.split('\n').filter(l => l.trim());
    let count = 0;
    
    for (const line of lines) {
        count++;
        try {
            if (!line.includes('spotify.com') && !line.includes('spotify:album:')) {
                throw new Error("Not a recognized Spotify URL/URI");
            }
            const metadata = await fetchAlbumMetadata(line.trim());
            const isDuplicate = albums.some(a => a.spotifyId === metadata.spotifyId || a.title.toLowerCase() === metadata.title.toLowerCase());
            
            if (isDuplicate) {
                 logs.push({ status: 'error', message: `Skipped Duplicate: ${metadata.title}` });
            } else {
                await addAlbum({
                    ...metadata,
                    status: 'Collection',
                    format: 'Digital',
                    addedAt: Date.now()
                });
                logs.push({ status: 'success', message: `Imported: ${metadata.title}` });
            }
        } catch (err) {
            logs.push({ status: 'error', message: `Failed: ${line.substring(0, 40)}... - ${err.message}` });
        }
        if (count % 5 === 0) updateLogs();
    }
    updateLogs();
    
    setIsImporting(false);
    if (logs.every(l => l.status === 'success')) {
        setImportText(""); 
    }
  };

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
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
                            Paste a list of Spotify Album URLs (one per line) or paste raw JSON / CSV data to batch import.
                        </p>
                         <div className="flex items-center gap-4"> 
                              <textarea
                                  value={importText}
                                  onChange={(e) => setImportText(e.target.value)}
                                  placeholder={'https://open.spotify.com/...\n\n[{"title": "Album", ...}]\n\nTitle,Artist,Year...'}
                                  className="w-full h-40 rounded-lg bg-neutral-950 border border-neutral-800 p-4 text-sm font-mono text-neutral-300 focus:border-emerald-500 focus:outline-none resize-none"
                              />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-neutral-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-neutral-900 px-2 text-neutral-500">Or upload file</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-center w-full">
                            <label 
                                htmlFor="json-upload" 
                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                    isDragging 
                                    ? "border-emerald-500 bg-emerald-900/20" 
                                    : "border-neutral-800 bg-neutral-950/50 hover:bg-neutral-900 hover:border-emerald-500/50"
                                }`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDragging(true);
                                }}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDragging(true);
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDragging(false);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDragging(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (e) => setImportText(e.target.result);
                                        reader.readAsText(file);
                                    }
                                }}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="flex gap-2 mb-3 text-neutral-400">
                                        <FileJson className="w-8 h-8" />
                                        <FileSpreadsheet className="w-8 h-8" />
                                    </div>
                                    <p className="mb-2 text-sm text-neutral-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-neutral-500">JSON or CSV files</p>
                                </div>
                                <input 
                                    id="json-upload" 
                                    type="file" 
                                    accept=".json, .csv"
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (e) => setImportText(e.target.result);
                                            reader.readAsText(file);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>

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
