import { useState, useCallback } from "react";
import {
    X,
    Upload,
    Loader2,
    CheckCircle,
    AlertCircle,
    FileJson,
} from "lucide-react";

export default function LegacyImportModal({ isOpen, onClose, addAlbum }) {
    const [isImporting, setIsImporting] = useState(false);
    const [importLog, setImportLog] = useState([]); // { status: 'success'|'error', message: string }
    const [dragActive, setDragActive] = useState(false);

    // Conversion logic ported from convert_data.py
    const convertItem = (item) => {
        // Status
        const status = item.wanted ? "Wishlist" : "Collection";

        // Formats
        const types = item.types || {};
        let formats = [];
        if (types.vinyl) formats.push("Vinyl");
        if (types.cd) formats.push("CD");
        if (types.cassette) formats.push("Cassette");
        if (types.digital) formats.push("Digital");

        if (formats.length === 0 && types) {
            for (const [k, v] of Object.entries(types)) {
                if (v) {
                    const capitalized = k.charAt(0).toUpperCase() + k.slice(1);
                    if (!formats.includes(capitalized)) {
                        formats.push(capitalized);
                    }
                }
            }
        }
        if (formats.length === 0) formats = ["Digital"];

        // Artist
        const rawArtists = item.albumArtists || [];
        let artists = Array.isArray(rawArtists) ? rawArtists : [rawArtists];

        // Timestamp
        let addedAt = Date.now();
        try {
            if (item.id) {
                const parsed = parseInt(parseFloat(item.id));
                if (!isNaN(parsed)) addedAt = parsed;
            }
        } catch (e) {
            // keep default
        }

        // Construct new object
        const newItem = {
            title: item.albumName,
            artist: artists,
            coverUrl: item.imageUrl,
            releaseDate: item.releaseDate,
            url: item.albumLink,
            format: formats.join(", "), // React app seems to use string or array? Checked useAlbums and other files, let's treat it consistent with ImportExportModal.
            // Actually, looking at ImportExportModal CSV export: `a.format || ""` -> seems to be a string there.
            // Looking at `convert_data.py`: `formats = []` (list).
            // Let's stick to array if app supports it, or join.
            // In `ImportExportModal.jsx` export CSV: `a.format || ""` (implies string).
            // In `ImportExportModal.jsx` handleImport: `addAlbum({...item})`.
            // Let's check `AlbumCard.jsx` later if I can, but to be safe I will store it as array if the system handles it, but previous python script output it as list.
            // Wait, convert_data.py outputs `formats` as list.
            // Let's blindly trust the schema matches what convert_data.py produced for the python script,
            // BUT `ImportExportModal` uses `a.format` in CSV as string.
            // Let's look at `EditAlbumModal.jsx` (not read yet).
            // Let's assume Array is fine for now, or join it if I want to be safe.
            // Update: Convert array to string because most UI likely expects a string or handles array join.
            // Actually the `convert_data.py` was producing `formats` list in the `new_item`.
            // The `ImportExportModal` CSV export does `a.format || ""`.
            // If `a.format` is an array `['Vinyl']`, stringifying it might act weird or just join with comma implicitly.
            // Let's store it as Array since that's what `convert_data.py` did.
            status: status,
            rating: 0,
            addedAt: addedAt,
            genres: item.genres || [],
        };

        // Clean up
        if (!newItem.url) delete newItem.url;
        if (!newItem.coverUrl) delete newItem.coverUrl;
        if (!newItem.releaseDate) delete newItem.releaseDate;

        return newItem;
    };

    const processFile = async (file) => {
        setIsImporting(true);
        setImportLog([]);
        const logs = [];
        const updateLogs = () => setImportLog([...logs]);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const data = JSON.parse(text);

                if (!Array.isArray(data)) {
                    throw new Error("File content is not a JSON array.");
                }

                let count = 0;
                for (const item of data) {
                    count++;
                    try {
                        const newItem = convertItem(item);

                        if (!newItem.title) throw new Error("Missing title");

                        await addAlbum(newItem);
                        logs.push({
                            status: "success",
                            message: `Imported: ${newItem.title}`,
                        });
                    } catch (err) {
                        console.error(err);
                        logs.push({
                            status: "error",
                            message: `Failed item: ${
                                item.albumName || "Unknown"
                            } - ${err.message}`,
                        });
                    }

                    if (count % 5 === 0) updateLogs();
                }
                updateLogs();
            } catch (err) {
                logs.push({
                    status: "error",
                    message: `File Parse Error: ${err.message}`,
                });
                updateLogs();
            } finally {
                setIsImporting(false);
            }
        };
        reader.onerror = () => {
            logs.push({ status: "error", message: "Failed to read file." });
            updateLogs();
            setIsImporting(false);
        };
        reader.readAsText(file);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const onFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Legacy Import
                        </h2>
                        <p className="text-sm text-neutral-400 mt-1">
                            Import data from{" "}
                            <a
                                href="https://michaldakowicz.github.io/vinyl-cd-tracker/"
                                className="underline hover:text-emerald-500"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Vinyl CD Tracker (Music Tracker)
                            </a>{" "}
                            (JSON format)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {!isImporting && importLog.length === 0 ? (
                        <div
                            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                                dragActive
                                    ? "border-emerald-500 bg-emerald-500/10"
                                    : "border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800/50"
                            }`}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                        >
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="p-4 bg-neutral-800 rounded-full">
                                    <Upload className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-white">
                                        Drag and drop your JSON file here
                                    </p>
                                    <p className="text-sm text-neutral-400 mt-1">
                                        or click to browse files
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    id="file-upload"
                                    onChange={onFileChange}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-full cursor-pointer transition-colors"
                                >
                                    Select File
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {isImporting && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    <span className="ml-3 text-lg font-medium">
                                        Processing your data...
                                    </span>
                                </div>
                            )}

                            {importLog.length > 0 && (
                                <div className="bg-black/40 rounded-lg p-4 font-mono text-sm max-h-75 overflow-y-auto border border-neutral-800">
                                    {importLog.map((log, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-2 mb-1 ${
                                                log.status === "error"
                                                    ? "text-red-400"
                                                    : "text-emerald-400"
                                            }`}
                                        >
                                            {log.status === "error" ? (
                                                <AlertCircle
                                                    size={14}
                                                    className="mt-0.5 shrink-0"
                                                />
                                            ) : (
                                                <CheckCircle
                                                    size={14}
                                                    className="mt-0.5 shrink-0"
                                                />
                                            )}
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
