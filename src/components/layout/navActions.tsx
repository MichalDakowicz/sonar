import { useRouter } from 'expo-router';
import { ArrowLeft, CalendarRange, Inbox, Plus, Search, Settings, type LucideIcon } from 'lucide-react-native';
import { useCallback } from 'react';

import { useIncomingRequestCount } from '@/hooks/useFriends';
import { periodShortLabel } from '@/lib/statsPeriod';
import { useQuickAddSheetStore } from '@/store/quickAddSheet';
import { useSearchFocus } from '@/store/searchFocus';
import { useStatsPeriod, useStatsPeriodSheet } from '@/store/statsPeriod';

export type NavAction = {
  label: string;
  Icon: LucideIcon;
  /** Unread count on the button, 0 for none. */
  badge: number;
  onPress: () => void;
};

const ICONS: Record<string, LucideIcon> = {
  index: Plus,
  discover: Search,
  stats: CalendarRange,
  social: Inbox,
  profile: Settings,
};

// Routes pushed out of the tabs that still render the bar. Their destination
// stays lit, but the left island becomes Back: a tab's usual action here would
// be the screen you are already standing on.
const NESTED_ROUTES = ['/settings', '/inbox', '/history', '/reorder'];

export function isNestedNavRoute(pathname: string): boolean {
  return NESTED_ROUTES.includes(pathname);
}

/**
 * The one thing the current screen wants you to do, resolved for the nav bar's
 * left island — the same contract as Radar's: each screen used to hang its own
 * controls off a global header, and now the bar asks for the single action that
 * screen is about.
 *
 * Wiring lives here rather than in the screens because four of the five targets
 * are already global — the Quick-Add sheet, the focused screen's search input,
 * the period sheet the tabs layout mounts, and two pushed routes.
 */
export function useNavAction(pathname: string, activeTab: string | null): NavAction {
  const router = useRouter();
  const presentQuickAdd = useQuickAddSheetStore((s) => s.present);
  const presentPeriod = useStatsPeriodSheet((s) => s.present);
  const period = useStatsPeriod((s) => s.period);
  const inboxCount = useIncomingRequestCount();
  const nested = isNestedNavRoute(pathname);

  const onPress = useCallback(() => {
    if (nested) return router.back();
    switch (activeTab) {
      case 'index':
        return presentQuickAdd?.();
      case 'discover':
        return useSearchFocus.getState().focus?.();
      case 'stats':
        return presentPeriod?.();
      case 'social':
        return router.push('/inbox');
      case 'profile':
        return router.push('/settings');
    }
  }, [nested, activeTab, presentQuickAdd, presentPeriod, router]);

  if (nested) {
    return { label: 'Back', Icon: ArrowLeft, badge: 0, onPress };
  }

  const labels: Record<string, string> = {
    index: 'Add an album',
    discover: 'Search',
    stats: `Time period: ${periodShortLabel(period)}`,
    social: inboxCount ? `Requests, ${inboxCount} waiting` : 'Friend requests',
    profile: 'Settings',
  };
  const key = activeTab ?? 'index';

  return {
    label: labels[key] ?? 'Add an album',
    Icon: ICONS[key] ?? Plus,
    badge: key === 'social' ? inboxCount : 0,
    onPress,
  };
}

/** Anything waiting in the inbox — the dot the Social destination wears from any tab. */
export function useSocialAlert(): boolean {
  return useIncomingRequestCount() > 0;
}
