import { useColorScheme } from 'nativewind';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

import { rawThemeVars, themeVars } from './colors';

const storage = createMMKV({ id: 'radar-theme' });
const THEME_KEY = 'theme_preference';
const DEFAULT_THEME: ThemePreference = 'dark';

export type ThemePreference = 'dark' | 'light' | 'system';

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const stored = storage.getString(THEME_KEY);
    return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : DEFAULT_THEME;
  });

  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  const setTheme = (next: ThemePreference) => {
    storage.set(THEME_KEY, next);
    setThemeState(next);
  };

  const resolvedTheme: 'dark' | 'light' = colorScheme === 'light' ? 'light' : 'dark';

  // On web, react-native-web's Modal portals its content to a node appended
  // directly to document.body, outside the themed wrapper View below - CSS
  // custom properties only cascade through real DOM ancestry, not React
  // context, so anything inside a Modal would otherwise see no --card/
  // --background/etc and render transparent. Mirroring the vars onto
  // document.documentElement makes them available root-wide instead.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    for (const [key, value] of Object.entries(rawThemeVars[resolvedTheme])) {
      document.documentElement.style.setProperty(key, value);
    }
  }, [resolvedTheme]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={themeVars[resolvedTheme]} className="flex-1 bg-background">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
