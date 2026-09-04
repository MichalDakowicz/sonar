import { BlurTargetView } from 'expo-blur';
import { createContext, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Platform, type View } from 'react-native';

/**
 * The view the nav islands' glass samples.
 *
 * expo-blur's Android backend (Dimezis BlurView) does not read the window
 * behind it — it re-draws a nominated view, excluding the blur view itself.
 * Without a `blurTarget` it logs "the blurTarget prop has not been configured"
 * and silently falls back to a flat tint, which is what the islands looked like
 * before this existed: painted on rather than glass.
 *
 * So the whole app renders inside one `BlurTargetView` and the bar reads its
 * handle from here.
 *
 * The target is held as state, not as a plain ref, because BlurView resolves
 * the node handle in `componentDidMount` and only re-resolves when the
 * `blurTarget` *prop identity* changes. React attaches refs bottom-up, so the
 * bar mounts before this view exists — a stable ref object would be read once,
 * while it was still null, and never again. Publishing a fresh `{ current }`
 * once the node attaches is what makes the bar re-read it.
 *
 * iOS and web blur the real backdrop and ignore the target, so off Android this
 * is a plain passthrough that adds no view to the tree.
 */
const BlurTargetContext = createContext<RefObject<View | null> | undefined>(undefined);

export function BlurTargetProvider({ children }: { children: ReactNode }) {
  const targetRef = useRef<View | null>(null);
  const [node, setNode] = useState<View | null>(null);
  const value = useMemo(() => ({ current: node }), [node]);

  if (Platform.OS !== 'android') return <>{children}</>;

  return (
    <BlurTargetContext.Provider value={value}>
      {/* Published from onLayout rather than from a ref callback: the native
          component types its `ref` as a RefObject, and onLayout is the first
          moment after mount where the node is guaranteed to exist. Guarded, so
          a rotation or a keyboard resize does not re-publish it. */}
      <BlurTargetView
        ref={targetRef}
        style={{ flex: 1 }}
        onLayout={() => {
          if (targetRef.current && targetRef.current !== node) setNode(targetRef.current);
        }}
      >
        {children}
      </BlurTargetView>
    </BlurTargetContext.Provider>
  );
}

/** Undefined off Android, and `{ current: null }` until the view has attached. */
export function useBlurTarget(): RefObject<View | null> | undefined {
  return useContext(BlurTargetContext);
}
