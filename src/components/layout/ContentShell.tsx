import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { MAX_W, useIsDesktop } from '@/hooks/useResponsive';

type ContentShellProps = {
  children: ReactNode;
  /** One of MAX_W (defaults to the text column). */
  maxWidth?: number;
  /** Set when the shell wraps a virtualized list that must fill the viewport. */
  fill?: boolean;
  onLayout?: ViewProps['onLayout'];
};

/**
 * Centres a screen's content in a capped column on desktop web and gets out of
 * the way entirely on phones (no extra View, so native layout is untouched).
 * Every desktop screen wraps its body in one of these instead of hard-coding
 * `max-w-*` classes, so the caps stay in one table (MAX_W).
 */
export function ContentShell({ children, maxWidth = MAX_W.text, fill, onLayout }: ContentShellProps) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    // `fill` still needs the flex-1 box on phones - it's what bounds a child
    // ScrollView/list's height. Without it the shell would silently change
    // phone layout, which it must never do.
    if (!fill && !onLayout) return <>{children}</>;
    return (
      <View className={fill ? 'flex-1' : 'w-full'} onLayout={onLayout}>
        {children}
      </View>
    );
  }

  return (
    <View className={fill ? 'w-full flex-1 self-center' : 'w-full self-center'} style={{ maxWidth }} onLayout={onLayout}>
      {children}
    </View>
  );
}
