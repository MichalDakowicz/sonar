import { useState, useEffect, useRef } from "react";
import { X, Play } from "lucide-react";
import Logo from "../../components/ui/Logo";
import { useLogListen } from "../../hooks/useHistory";

export default function RandomSpinModal({ isOpen, onClose, albums, onSelect }) {
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const { logListen } = useLogListen();

  // Sounds or other effects could go here

  useEffect(() => {
    if (isOpen && albums.length > 0) {
      startSpin();
    } else {
        // Reset when closed
        setWinner(null);
        setIsSpinning(false);
    }
  }, [isOpen]);

  const startSpin = () => {
    setIsSpinning(true);
    setWinner(null);
    
    // Pick winner immediately but don't show yet
    const winningIndex = Math.floor(Math.random() * albums.length);
    const winningAlbum = albums[winningIndex];

    let speed = 50;
    let counter = 0;
    const maxSpins = 30; // How many flips before stopping
    
    const spin = () => {
      // Show random album while spinning
      const randomIndex = Math.floor(Math.random() * albums.length);
      setCurrentAlbum(albums[randomIndex]);

      counter++;
      
      if (counter < maxSpins) {
        // Slow down exponentially at the end
        if (counter > maxSpins - 10) {
            speed *= 1.2;
        }
        setTimeout(spin, speed);
      } else {
        // Stop on winner
        setCurrentAlbum(winningAlbum);
        setWinner(winningAlbum);
        setIsSpinning(false);
        if (onSelect) onSelect(winningAlbum.id);
      }
    };

    spin();
  };

  const handleLogListen = (e) => {
      e.stopPropagation();
      if (winner) logListen(winner);
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-neutral-800 text-white transition-colors"
        >
            <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Logo className={`text-emerald-500 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? "Digging in the crates..." : "Your Spin for the Night"}
            </h2>

            {/* Album Cover Display */}
            <div className="relative w-64 h-64 mb-6 rounded-lg overflow-hidden shadow-2xl bg-neutral-800 border-2 border-neutral-700">
                {currentAlbum ? (
                    <>
                         {currentAlbum.coverUrl ? (
                            <img 
                                src={currentAlbum.coverUrl} 
                                alt={currentAlbum.title} 
                                className="w-full h-full object-cover"
                            />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Logo size={64} className="text-neutral-700" />
                            </div>
                         )}
                         
                         {/* Highlight Effect */}
                         {winner && (
                             <div className="absolute inset-0 ring-4 ring-emerald-500 animate-pulse"></div>
                         )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                        ?
                    </div>
                )}
            </div>

            {/* Album Info */}
            <div className="space-y-1 mb-8 h-16">
                {currentAlbum && (
                    <>
                        <div className="text-lg font-bold text-white truncate max-w-70">
                            {currentAlbum.title}
                        </div>
                        <div className="text-neutral-400 truncate max-w-70">
                            {Array.isArray(currentAlbum.artist) ? currentAlbum.artist.join(", ") : currentAlbum.artist}
                        </div>
                    </>
                )}
            </div>

            {/* Actions for Winner */}
            {winner && !isSpinning && (
                <div className="flex gap-3 w-full animate-in slide-in-from-bottom-4 duration-500">
                    <button 
                        onClick={startSpin}
                        className="flex-1 py-3 rounded-lg bg-neutral-800 text-white font-medium hover:bg-neutral-700 transition-colors"
                    >
                        Spin Again
                    </button>
                    
                    {winner.status !== "Wishlist" && (
                        <button 
                            onClick={() => {
                                if (winner) {
                                    logListen(winner);
                                    onClose();
                                }
                            }}
                            className="flex-1 py-3 rounded-lg bg-white text-black font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Play size={18} fill="currentColor" />
                            Log Listen
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
