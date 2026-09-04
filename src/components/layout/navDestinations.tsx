import { type Href } from 'expo-router';
import { BarChart3, CircleUserRound, Disc3, Star, Users } from 'lucide-react-native';
import { type ReactNode } from 'react';

// The five destinations, in bar order. Two consumers read this list and they
// must not drift: the nav islands render it (components/layout/NavIslands) and
// the web digit shortcuts index into it (hooks/useWebShortcuts via the root
// layout). Keep it in sync with the Tabs.Screen order in (tabs)/_layout.tsx.
export type NavDestination = {
  href: Href;
  label: string;
  /** Route name in (tabs) — the key the navigator and `withTabReload` use. */
  tabName: string;
  icon: (color: string, size: number) => ReactNode;
  /**
   * Route-driven rather than read off the tab navigator, because the bar also
   * renders on routes pushed *out* of the tabs (/settings, /inbox, /history).
   * Those keep their parent destination lit — you have not left Profile just
   * because you opened its settings.
   */
  isActive: (pathname: string) => boolean;
};

export const NAV_DESTINATIONS: NavDestination[] = [
  {
    href: '/',
    label: 'Collection',
    tabName: 'index',
    icon: (color, size) => <Disc3 color={color} size={size} />,
    isActive: (pathname) => pathname === '/',
  },
  {
    href: '/ratings',
    label: 'Ratings',
    tabName: 'ratings',
    icon: (color, size) => <Star color={color} size={size} />,
    // A release page is opened from the board or from its search, so it belongs
    // to this tab — it is also the only route where an unowned album is edited.
    isActive: (pathname) => pathname.startsWith('/ratings') || pathname.startsWith('/release'),
  },
  {
    href: '/stats',
    label: 'Stats',
    tabName: 'stats',
    icon: (color, size) => <BarChart3 color={color} size={size} />,
    isActive: (pathname) => pathname.startsWith('/stats'),
  },
  {
    href: '/social',
    label: 'Social',
    tabName: 'social',
    icon: (color, size) => <Users color={color} size={size} />,
    // /inbox, an activity thread and a friend's shelf are pushed from this tab,
    // so it stays lit while you are down there.
    isActive: (pathname) =>
      pathname.startsWith('/social') ||
      pathname.startsWith('/friend') ||
      pathname.startsWith('/inbox') ||
      pathname.startsWith('/activity'),
  },
  {
    href: '/profile',
    label: 'Profile',
    tabName: 'profile',
    icon: (color, size) => <CircleUserRound color={color} size={size} />,
    // /settings, /history and /reorder are pushed from this tab, same reasoning.
    isActive: (pathname) =>
      pathname.startsWith('/profile') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/history') ||
      pathname.startsWith('/reorder'),
  },
];

/** Which destination owns the current route, or null on a route no tab claims. */
export function activeTabFor(pathname: string): string | null {
  return NAV_DESTINATIONS.find((destination) => destination.isActive(pathname))?.tabName ?? null;
}
