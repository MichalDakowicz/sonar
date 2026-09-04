import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Island height, and the gap it keeps from the screen edge and from content. */
export const NAV_ISLAND_HEIGHT = 52;
export const NAV_ISLAND_GAP = 10;

/**
 * Vertical space a scrolling body must leave at its bottom so its last row
 * clears the floating nav. The bar is absolutely positioned (that is what lets
 * the glass sit *over* posters), so it reserves no layout of its own and every
 * list has to pad for it.
 */
export function useNavBarSpace(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + NAV_ISLAND_GAP * 2 + NAV_ISLAND_HEIGHT;
}
