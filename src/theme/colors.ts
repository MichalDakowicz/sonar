import { vars } from 'nativewind';

/**
 * The same token set Radar uses, with one deliberate difference: `--primary` is
 * Sonar's emerald (#10b981, the accent the web app was built around) where
 * Radar's is blue. Everything else matches, so a component lifted from one app
 * lands in the other with no restyling — that is the whole point of keeping the
 * two on one design system.
 */
const dark = {
  '--background': '0 0% 3.9%',
  '--foreground': '0 0% 98%',
  '--card': '0 0% 3.9%',
  '--card-foreground': '0 0% 98%',
  '--popover': '0 0% 3.9%',
  '--popover-foreground': '0 0% 98%',
  '--primary': '160 84% 39%',
  // White on the emerald fill, as Radar does on its blue. Near-black measures
  // better against this particular green, but it reads as a mistake on a dark
  // UI where every other label is light, so legibility loses to consistency
  // here. The emerald itself stays bright because it is also the icon and
  // hairline colour against near-black backgrounds, where a darker green would
  // disappear.
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 14.9%',
  '--secondary-foreground': '0 0% 98%',
  '--muted': '0 0% 14.9%',
  '--muted-foreground': '0 0% 63.9%',
  '--accent': '0 0% 14.9%',
  '--accent-foreground': '0 0% 98%',
  '--destructive': '0 62.8% 30.6%',
  '--destructive-foreground': '0 0% 98%',
  '--border': '0 0% 14.9%',
  '--input': '0 0% 14.9%',
  '--ring': '160 84% 39%',
};

const light = {
  '--background': '0 0% 98%',
  '--foreground': '0 0% 9%',
  '--card': '0 0% 100%',
  '--card-foreground': '0 0% 9%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '0 0% 9%',
  '--primary': '158 64% 36%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 96%',
  '--secondary-foreground': '0 0% 9%',
  '--muted': '0 0% 96%',
  '--muted-foreground': '0 0% 45%',
  '--accent': '0 0% 96%',
  '--accent-foreground': '0 0% 9%',
  '--destructive': '0 62.8% 40%',
  '--destructive-foreground': '0 0% 98%',
  '--border': '0 0% 90%',
  '--input': '0 0% 90%',
  '--ring': '158 64% 36%',
};

export const themeVars = {
  dark: vars(dark),
  light: vars(light),
};

// Raw (unwrapped) maps, for also writing these vars onto document.documentElement
// on web - see ThemeProvider's comment on why that's needed.
export const rawThemeVars = { dark, light };

export type ResolvedTheme = keyof typeof themeVars;

/**
 * Literal colour strings for the places NativeWind classes cannot reach: a
 * lucide icon's `color` prop, a StyleSheet in the nav islands, an inline style
 * on an animated view. One table, so the accent is changed in exactly one file.
 */
export const COLORS = {
  accent: 'hsl(160 84% 39%)',
  accentSoft: 'hsla(160,84%,39%,0.15)',
  foreground: 'hsl(0 0% 98%)',
  muted: 'hsl(0 0% 63.9%)',
  mutedDeep: 'hsl(0 0% 45%)',
  danger: '#ef4444',
  star: '#fbbf24',
} as const;
