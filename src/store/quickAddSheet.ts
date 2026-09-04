import { create } from 'zustand';

type QuickAddSheetState = {
  present: (() => void) | null;
  setPresent: (present: (() => void) | null) => void;
};

// The QuickAddSheet mounts once in the (tabs) layout (doc 12 part 2 - Add is
// reachable from every screen via the header, mirroring legacy Navbar's
// global "Add Movie" button); this store lets any screen's Header trigger it
// without re-mounting the sheet per tab.
export const useQuickAddSheetStore = create<QuickAddSheetState>((set) => ({
  present: null,
  setPresent: (present) => set({ present }),
}));
