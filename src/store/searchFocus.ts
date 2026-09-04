import { create } from 'zustand';

type SearchFocusState = {
  focus: (() => void) | null;
  setFocus: (focus: (() => void) | null) => void;
};

// The focused screen registers its search input here so the global "/" keyboard
// shortcut (useWebShortcuts) can reach it without the shell knowing which
// screen is mounted or how its toolbar is built.
export const useSearchFocus = create<SearchFocusState>((set) => ({
  focus: null,
  setFocus: (focus) => set({ focus }),
}));
