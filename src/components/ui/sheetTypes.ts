import type { ReactNode } from 'react';

/**
 * Imperative handle every Sheet exposes. Still named BottomSheetModal where
 * it's re-exported, because ~10 call sites already type their refs with that
 * name — the engine behind it changed, the contract did not.
 *
 * present/dismiss/snapToIndex are the only members anyone calls; the rest exist
 * so refs written against the old gorhom handle keep compiling.
 */
export type SheetHandle = {
  present: () => void;
  dismiss: () => void;
  close: () => void;
  forceClose: () => void;
  collapse: () => void;
  expand: () => void;
  snapToIndex: (index: number) => void;
  snapToPosition: (position: number | string) => void;
};

export type SheetProps = {
  children: ReactNode;
  /** Heights as `'70%'` of the window or absolute px. Order is not significant. */
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  /** Fires with the active snap index, or -1 once closed. */
  onChange?: (index: number) => void;
  /** Desktop dialog width cap. Wider for sheets that hold a grid of results. */
  maxWidth?: number;
  /**
   * Height the content actually needs, for sheets whose content is intrinsic
   * (a short list of filter chips) rather than something that should fill the
   * sheet (a scrolling grid of results). The sheet shrinks to fit it and
   * `snapPoints` becomes the ceiling, so a panel never renders with half its
   * height empty. Measure it with a ScrollView's `onContentSizeChange` and pass
   * the raw content height — the sheet adds its own chrome.
   */
  contentHeight?: number;
};

/** Grab-bar strip above sheet content. Chrome the caller shouldn't have to know about. */
export const SHEET_HANDLE_HEIGHT = 28;

/** Never let a sheet cover the whole screen — the backdrop has to stay tappable. */
const MAX_HEIGHT_RATIO = 0.94;

/**
 * Snap points resolved to ascending pixel heights. Shared so the phone panel and
 * the desktop dialog agree on how tall `'85%'` is.
 */
export function resolveSnapPoints(snapPoints: (string | number)[], windowHeight: number): number[] {
  const ceiling = windowHeight * MAX_HEIGHT_RATIO;
  const resolved = snapPoints
    .map((point) => {
      if (typeof point === 'number') return point;
      // A bare string is absolute px, so `['70%', 320]` survives a String()
      // round trip - which is how SheetPanel keeps its memo key stable.
      const trimmed = point.trim();
      const value = parseFloat(trimmed);
      if (!Number.isFinite(value)) return NaN;
      return trimmed.endsWith('%') ? (value / 100) * windowHeight : value;
    })
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.min(value, ceiling));

  const unique = Array.from(new Set(resolved)).sort((a, b) => a - b);
  return unique.length ? unique : [Math.min(windowHeight * 0.5, ceiling)];
}
