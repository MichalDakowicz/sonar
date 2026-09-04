import { useEffect } from 'react';

import { isWeb } from '@/hooks/useResponsive';
import { useQuickAddSheetStore } from '@/store/quickAddSheet';
import { useSearchFocus } from '@/store/searchFocus';

type WebShortcutsOptions = {
  /** Jump to the nth tab (0-based) - the digits shown in the sidebar. */
  onSelectTab: (index: number) => void;
  enabled?: boolean;
};

/**
 * Keyboard-first navigation for the browser build: `1`-`9` switch destination,
 * `n` opens Add, `/` focuses the current screen's search box. A no-op on
 * native, and suppressed whenever focus is inside a text field so typing a "n"
 * into a search box doesn't open a sheet.
 */
export function useWebShortcuts({ onSelectTab, enabled = true }: WebShortcutsOptions) {
  useEffect(() => {
    if (!isWeb || !enabled || typeof window === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as (HTMLElement & { isContentEditable?: boolean }) | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;

      if (event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        onSelectTab(Number(event.key) - 1);
        return;
      }

      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        useQuickAddSheetStore.getState().present?.();
        return;
      }

      if (event.key === '/') {
        const focus = useSearchFocus.getState().focus;
        if (!focus) return;
        event.preventDefault();
        focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, onSelectTab]);
}
