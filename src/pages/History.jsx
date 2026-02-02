import React from 'react';
import { useHistory } from '../hooks/useHistory';
import { ArrowLeft, Clock, Music, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../lib/utils';

export default function History() {
  const { history, loading, removeHistoryItem } = useHistory();

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 pb-20 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="p-2 rounded-full hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-2">
            <Clock className="text-emerald-500" size={28} />
            <h1 className="text-3xl font-bold">Listening History</h1>
          </div>
        </div>

        {/* Content */}
        {loading ? (
             <div className="text-neutral-500 text-center py-10">Loading history...</div>
        ) : history.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/50 rounded-xl border border-neutral-800">
                <Music className="mx-auto h-12 w-12 text-neutral-700 mb-3" />
                <p className="text-neutral-400 text-lg">No music logged yet.</p>
                <p className="text-neutral-500 text-sm">Start spinning your collection to see history here.</p>
            </div>
        ) : (
            <div className="space-y-3">
                {history.map((entry) => (
                    <div 
                        key={entry.id} 
                        className="group flex items-center gap-4 p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors"
                    >
                         <div className="h-12 w-12 shrink-0 rounded bg-neutral-800 overflow-hidden">
                            {entry.coverUrl ? (
                                <img src={entry.coverUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <Music size={20} className="text-neutral-700" />
                                </div>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                             <h3 className="font-medium truncate">{entry.title}</h3>
                             <p className="text-sm text-neutral-400 truncate">
                                {Array.isArray(entry.artist) ? entry.artist.join(", ") : entry.artist}
                             </p>
                         </div>
                         <div className="flex items-center gap-4 shrink-0">
                             <div className="text-right">
                                 <div className="text-sm text-neutral-400">{formatRelativeTime(entry.timestamp)}</div>
                                 <div className="text-xs text-neutral-600">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                             </div>
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeHistoryItem(entry.id);
                                }}
                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-neutral-500 hover:text-red-500 hover:bg-neutral-800 rounded transition-all"
                                title="Remove from history"
                             >
                                <Trash2 size={16} />
                             </button>
                         </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
