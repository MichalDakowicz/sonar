import { useEffect, useRef, type ComponentType } from 'react';
import { create } from 'zustand';

// Double-pressing a tab reloads that screen to a fresh state. We do it by
// remounting: each tab route holds a nonce here, and `withTabReload` feeds it
// as the component `key` so a bump throws away all local state (search text,
// filters, scroll position) and re-runs mount effects. The layout's tabPress
// listener (see (tabs)/_layout.tsx) decides when a press counts as a reload.
type TabReloadState = {
  nonces: Record<string, number>;
  bump: (name: string) => void;
};

export const useTabReload = create<TabReloadState>((set) => ({
  nonces: {},
  bump: (name) =>
    set((s) => ({ nonces: { ...s.nonces, [name]: (s.nonces[name] ?? 0) + 1 } })),
}));

/**
 * Wrap a tab screen so a `bump(name)` remounts it. `name` must match the
 * route name used in `(tabs)/_layout.tsx` (i.e. the file basename).
 *
 * Remounting only clears state the screen owns. Anything durable - the
 * zustand+MMKV prefs a screen reads - survives it, so a screen with persisted
 * filters passes `onReload` to clear those too; it runs on every bump but not
 * on first mount.
 */
export function withTabReload<P extends object>(Component: ComponentType<P>, name: string, onReload?: () => void) {
  return function TabReloadable(props: P) {
    const nonce = useTabReload((s) => s.nonces[name] ?? 0);
    const lastHandled = useRef(nonce);

    useEffect(() => {
      if (lastHandled.current === nonce) return;
      lastHandled.current = nonce;
      onReload?.();
    }, [nonce]);

    return <Component key={nonce} {...props} />;
  };
}
