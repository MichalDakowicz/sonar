import { useEffect, useRef, type RefObject } from 'react';

// FlashList's ref surface, narrowed to the two ways of getting to the top.
// scrollToTop is preferred; scrollToOffset is the fallback for older refs.
type Scrollable = {
  scrollToTop?: (params?: { animated?: boolean }) => void;
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => void;
};

/**
 * Snaps a virtualized list back to the top whenever `signature` changes.
 *
 * Filtering, searching or re-sorting swaps the data under a list that keeps its
 * scroll offset, which drops the user into the middle of a result set they have
 * never seen. Pass a string built from every input that reshapes the list; the
 * first render is not treated as a change.
 *
 * The scroll is deferred by two frames on purpose. FlashList commits the new
 * data and settles its layout after this effect runs, and with
 * maintainVisibleContentPosition on (its default) that pass re-anchors the list
 * on whatever item was visible - undoing a scroll issued any earlier. Lists
 * using this hook should also pass `maintainVisibleContentPosition={{ disabled:
 * true }}`; the deferral is the belt to that pair of braces.
 */
export function useScrollToTopOnChange<T extends Scrollable>(signature: string): RefObject<T | null> {
  const ref = useRef<T>(null);
  const lastSignature = useRef(signature);

  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        const list = ref.current;
        if (!list) return;
        // Not animated: the list underneath has already been replaced, so there
        // is no continuity to preserve, and animating a long scroll from deep
        // in the old results just delays the answer.
        if (list.scrollToTop) list.scrollToTop({ animated: false });
        else list.scrollToOffset?.({ offset: 0, animated: false });
      });
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [signature]);

  return ref;
}
