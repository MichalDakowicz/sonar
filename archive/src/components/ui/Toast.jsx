import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = "default", duration = 3000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[320px] max-w-105 rounded-lg border p-4 shadow-2xl transition-all animate-in slide-in-from-right-full fade-in duration-300 ${
              t.variant === "destructive"
                ? "bg-red-950/90 border-red-900 text-red-50"
                : "bg-neutral-900/95 border-emerald-500/20 text-neutral-50 backdrop-blur-md"
            }`}
          >
            <div className="flex items-start gap-3">
               {t.variant === "destructive" ? (
                   <AlertCircle className="mt-0.5 shrink-0 text-red-400" size={18} />
               ) : (
                   <CheckCircle className="mt-0.5 shrink-0 text-emerald-500" size={18} />
               )}
              <div className="grid gap-1 flex-1">
                {t.title && <h3 className="font-semibold text-sm">{t.title}</h3>}
                {t.description && (
                  <div className="text-sm text-neutral-400 leading-relaxed">{t.description}</div>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-neutral-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

