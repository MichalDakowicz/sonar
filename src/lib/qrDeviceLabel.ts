/**
 * What a signed-out device calls itself when it asks to be let in (PING.md §9.14).
 *
 * The approving phone shows this beside the match code, worded as a claim — the
 * device chose the string, so it can say anything. It is still worth getting right,
 * because an honest "Lidar in Firefox on Windows" is what makes a stranger's
 * "Lidar in Chrome on Linux" stand out.
 */

const BROWSERS: readonly [RegExp, string][] = [
  [/Edg(?:e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

// Order matters: an Android user agent also says Linux, and an iPhone's says Mac OS X.
const SYSTEMS: readonly [RegExp, string][] = [
  [/Android/, 'Android'],
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Windows/, 'Windows'],
  [/CrOS/, 'ChromeOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
];

const named = (table: readonly [RegExp, string][], agent: string): string | null =>
  table.find(([pattern]) => pattern.test(agent))?.[1] ?? null;

/** `Lidar on Android` for the app, `Lidar in Chrome on Windows` for a browser. */
export function deviceLabel(app: string, platform: string, userAgent = ''): string {
  if (platform !== 'web') {
    const system = platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : null;
    return system ? `${app} on ${system}` : app;
  }
  const browser = named(BROWSERS, userAgent);
  const system = named(SYSTEMS, userAgent);
  const where = [browser && `in ${browser}`, system && `on ${system}`].filter(Boolean).join(' ');
  return where ? `${app} ${where}` : `${app} in a browser`;
}

/** A country's name in the reader's language, or null where the runtime cannot say. */
export function countryName(code: string, locale?: string): string | null {
  try {
    const names = new Intl.DisplayNames(locale ? [locale] : undefined, { type: 'region' });
    const name = names.of(code.toUpperCase());
    return name && name !== code.toUpperCase() ? name : null;
  } catch {
    return null;
  }
}
