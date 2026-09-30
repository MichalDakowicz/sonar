import Constants from 'expo-constants';

// Sonar ships to Android as a sideloaded APK attached to a GitHub release, so
// there is no store to surface updates. We poll the releases API instead and
// compare the tag against the version baked into app.json.
const OWNER = 'MichalDakowicz';
const REPO = 'sonar';

export const LATEST_RELEASE_API = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
export const RELEASES_PAGE_URL = `https://github.com/${OWNER}/${REPO}/releases/latest`;

export type LatestRelease = {
  /** Tag with any leading `v` stripped, e.g. `2.0`. */
  version: string;
  tag: string;
  name: string;
  notes: string;
  pageUrl: string;
  /** Direct APK download, or null when the release has no APK attached. */
  apkUrl: string | null;
};

type RawAsset = { name?: string; content_type?: string; browser_download_url?: string };
type RawRelease = {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: RawAsset[];
};

export function currentAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

/**
 * Splits `v1.2.3-beta.1` into numeric parts plus an optional prerelease tail.
 * Non-numeric segments degrade to 0 rather than NaN so a malformed tag can
 * never claim to be newer than a well-formed one.
 */
export function parseVersion(raw: string): { parts: number[]; prerelease: string | null } {
  const trimmed = raw.trim().replace(/^v/i, '');
  const [core, ...tail] = trimmed.split('-');
  const parts = core.split('.').map((segment) => {
    const value = Number.parseInt(segment, 10);
    return Number.isFinite(value) ? value : 0;
  });
  return { parts, prerelease: tail.length ? tail.join('-') : null };
}

/** Returns 1 when `a` is newer than `b`, -1 when older, 0 when equal. */
export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.parts.length, right.parts.length);

  for (let i = 0; i < length; i += 1) {
    const diff = (left.parts[i] ?? 0) - (right.parts[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  // Semver ordering: 1.0.0-beta precedes 1.0.0. Suffixes aren't ranked further.
  if (left.prerelease && !right.prerelease) return -1;
  if (!left.prerelease && right.prerelease) return 1;
  return 0;
}

export function isNewerVersion(latest: string, current: string): boolean {
  return compareVersions(latest, current) > 0;
}

export function pickApkAsset(assets: RawAsset[] | undefined): string | null {
  const apk = (assets ?? []).find(
    (asset) =>
      asset.content_type === 'application/vnd.android.package-archive' ||
      asset.name?.toLowerCase().endsWith('.apk'),
  );
  return apk?.browser_download_url ?? null;
}

export function normalizeRelease(raw: RawRelease): LatestRelease | null {
  const tag = raw.tag_name?.trim();
  if (!tag || raw.draft) return null;

  return {
    version: tag.replace(/^v/i, ''),
    tag,
    name: raw.name?.trim() || tag,
    notes: raw.body?.trim() ?? '',
    pageUrl: raw.html_url ?? RELEASES_PAGE_URL,
    apkUrl: pickApkAsset(raw.assets),
  };
}

/** Dismissing one release must not hide a later release. */
export function shouldShowUpdateNotice(
  release: LatestRelease | null,
  installedVersion: string,
  dismissedVersion: string | null,
): boolean {
  return !!release && isNewerVersion(release.version, installedVersion) && dismissedVersion !== release.version;
}

export async function fetchLatestRelease(timeoutMs = 10_000): Promise<LatestRelease | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`GitHub releases request failed (${response.status})`);
    return normalizeRelease((await response.json()) as RawRelease);
  } finally {
    clearTimeout(timer);
  }
}
