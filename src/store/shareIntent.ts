import { create } from 'zustand';

type ShareIntentState = {
  /** Raw text from another app's share sheet, awaiting a decision. */
  sharedText: string | null;
  setSharedText: (sharedText: string | null) => void;
};

/**
 * The share currently being decided on.
 *
 * Deliberately not an MMKV store: a share is a live hand-off, not a durable UI
 * preference, and a stale one surviving a restart would open the sheet over an
 * album the user shared days ago. The native module holds the pending value
 * until JS reads it, which is the only persistence this needs.
 */
export const useShareIntentStore = create<ShareIntentState>((set) => ({
  sharedText: null,
  setSharedText: (sharedText) => set({ sharedText }),
}));
