import { Tabs } from 'expo-router';
import { BarChart3, Disc3, Users } from 'lucide-react-native';

import { PublicHeader } from '@/components/layout/PublicHeader';
import { COLORS } from '@/theme/colors';

/**
 * Someone's public shelf. A nested Tabs navigator — the same primitive the main
 * group uses — with the profile chrome as a shared header, and a plain tab bar
 * rather than the floating islands: this is somebody else's space, and the
 * islands are the controls of *your* app.
 *
 * Reachable by anonymous users (the root gate only waits for auth to resolve,
 * it does not require a session), so a shared link opens in any browser.
 */
export default function PublicShelfLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <PublicHeader />,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#262626' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Collection', tabBarIcon: ({ color, size }) => <Disc3 color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: 'Stats', tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="friends"
        options={{ title: 'Friends', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
    </Tabs>
  );
}
