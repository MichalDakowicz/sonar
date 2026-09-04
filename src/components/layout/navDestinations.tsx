import { type Href } from 'expo-router';
import { BarChart3, CircleUserRound, Compass, Disc3, Users } from 'lucide-react-native';
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
    href: '/discover',
    label: 'Discover',
    tabName: 'discover',
    icon: (color, size) => <Compass color={color} size={size} />,
    // A release page opened from a search result belongs to Discover.
    isActive: (pathname) => pathname.startsWith('/discover') || pathname.startsWith('/release'),
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
    // /inbox and a friend's shelf are pushed from this tab, so it stays lit
    // while you are down there.
    isActive: (pathname) =>
      pathname.startsWith('/social') || pathname.startsWith('/friend') || pathname.startsWith('/inbox'),
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
