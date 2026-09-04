import { forwardRef, type ReactNode } from 'react';
import { FlatList, type FlatListProps, ScrollView, type ScrollViewProps } from 'react-native';

import { SearchInput } from '@/components/ui/SearchInput';
import { SheetDialog } from '@/components/ui/SheetDialog';
import { SheetPanel } from '@/components/ui/SheetPanel';
import type { SheetHandle, SheetProps } from '@/components/ui/sheetTypes';
import { useIsDesktop } from '@/hooks/useResponsive';

/**
 * Ref handle for a Sheet. Still exported under the gorhom name so the ~10 call
 * sites that type their refs `BottomSheetModal` keep working unchanged.
 */
export type BottomSheetModal = SheetHandle;

/**
 * Shared sheet primitive (doc 12 part 2) — the filter sheet and the Quick-Add /
 * status pickers all render through this instead of a bespoke Modal.
 *
 * Two implementations behind one API: a bottom sheet you drag on phones, and a
 * centred modal dialog on desktop web.
 *
 * Both are built on React Native's own Modal. This used to be
 * @gorhom/bottom-sheet, under which no sheet in the app could scroll its
 * content on device — see SheetPanel for why, and why the drag now lives on the
 * grab handle alone.
 */
export const Sheet = forwardRef<BottomSheetModal, SheetProps>(function Sheet(props, ref) {
  // Crossing the desktop breakpoint swaps implementations, which remounts the
  // sheet closed. That only happens while resizing the window past 1024px, where
  // the whole layout is changing anyway.
  const isDesktop = useIsDesktop();
  if (isDesktop) return <SheetDialog {...props} ref={ref} />;
  return <SheetPanel {...props} ref={ref} />;
});

/**
 * Text input for sheet content.
 *
 * The shared SearchInput now — a plain RN TextInput with the Android font-metric
 * fix. gorhom shipped its own to keep the soft keyboard from covering the sheet;
 * with the sheet being an ordinary Modal, the platform and SheetPanel's
 * KeyboardAvoidingView handle that, and gorhom's version broke on web anyway (it
 * calls `TextInput.State.currentlyFocusedInput()`, which react-native-web does
 * not implement). Kept as a named export so call sites don't have to change.
 */
export const BottomSheetTextInput = SearchInput;

/**
 * Scrollable body for sheet content. Plain ScrollView on both platforms — sheet
 * content is ordinary React Native now, so nothing special is required.
 */
export function SheetScrollView({ children, ...props }: ScrollViewProps & { children: ReactNode }) {
  return <ScrollView {...props}>{children}</ScrollView>;
}

/** Scrollable list for sheet content. Plain FlatList, for the same reason. */
export function SheetFlatList<ItemT>(props: FlatListProps<ItemT>) {
  return <FlatList {...props} />;
}
