import Constants from 'expo-constants';

import {
  compareVersions, currentAppVersion, fetchLatestRelease, isNewerVersion,
  LATEST_RELEASE_API, normalizeRelease, parseVersion, pickApkAsset,
  RELEASES_PAGE_URL, shouldShowUpdateNotice,
} from './appUpdate';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '2.0.0' } },
}));

describe('parseVersion', () => {
  it('strips a leading v and splits numeric parts', () => {
    expect(parseVersion('v2.1.3')).toEqual({ parts: [2, 1, 3], prerelease: null });
  });

  it('keeps the prerelease tail separate', () => {
    expect(parseVersion('1.0.0-beta.2')).toEqual({ parts: [1, 0, 0], prerelease: 'beta.2' });
  });

  it('degrades non-numeric segments to 0 instead of NaN', () => {
    expect(parseVersion('1.x.3').parts).toEqual([1, 0, 3]);
  });
});

describe('compareVersions', () => {
  it('orders by numeric precedence', () => {
    expect(compareVersions('2.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.9.9', '2.0')).toBe(-1);
  });

  it('treats missing trailing segments as zero', () => {
    expect(compareVersions('2.0', '2.0.0')).toBe(0);
    expect(compareVersions('2.0.1', '2.0')).toBe(1);
  });

  it('ranks a prerelease below the matching release', () => {
    expect(compareVersions('1.0.0-beta', '1.0.0')).toBe(-1);
    expect(compareVersions('1.0.0', '1.0.0-beta')).toBe(1);
  });
});

describe('isNewerVersion', () => {
  it('is false for the installed version and older tags', () => {
    expect(isNewerVersion('2.0', '2.0.0')).toBe(false);
    expect(isNewerVersion('1.4', '2.0')).toBe(false);
  });

  it('is true only for a strictly newer tag', () => {
    expect(isNewerVersion('2.1', '2.0')).toBe(true);
  });
});

describe('pickApkAsset', () => {
  it('prefers the android package asset', () => {
    expect(
      pickApkAsset([
        { name: 'source.zip', content_type: 'application/zip', browser_download_url: 'https://x/source.zip' },
        {
          name: 'sonar-v2.0.apk',
          content_type: 'application/vnd.android.package-archive',
          browser_download_url: 'https://x/sonar-v2.0.apk',
        },
      ]),
    ).toBe('https://x/sonar-v2.0.apk');
  });

  it('falls back to the .apk extension when the content type is generic', () => {
    expect(
      pickApkAsset([
        { name: 'sonar.apk', content_type: 'application/octet-stream', browser_download_url: 'https://x/sonar.apk' },
      ]),
    ).toBe('https://x/sonar.apk');
  });

  it('returns null when no APK is attached', () => {
    expect(pickApkAsset([])).toBeNull();
    expect(pickApkAsset(undefined)).toBeNull();
  });
});

describe('normalizeRelease', () => {
  it('maps the GitHub payload onto the release shape', () => {
    expect(
      normalizeRelease({
        tag_name: 'v2.0',
        name: 'v2.0',
        body: '  Rating rewrite  ',
        html_url: 'https://github.com/MichalDakowicz/sonar/releases/tag/v2.0',
        assets: [
          {
            name: 'sonar-v2.0.apk',
            content_type: 'application/vnd.android.package-archive',
            browser_download_url: 'https://x/sonar-v2.0.apk',
          },
        ],
      }),
    ).toEqual({
      version: '2.0',
      tag: 'v2.0',
      name: 'v2.0',
      notes: 'Rating rewrite',
      pageUrl: 'https://github.com/MichalDakowicz/sonar/releases/tag/v2.0',
      apkUrl: 'https://x/sonar-v2.0.apk',
    });
  });

  it('ignores drafts and untagged payloads', () => {
    expect(normalizeRelease({ tag_name: 'v3.0', draft: true })).toBeNull();
    expect(normalizeRelease({})).toBeNull();
  });
});

describe('app release identity', () => {
  it('uses this app repository for checks and the fallback download page', () => {
    expect(LATEST_RELEASE_API).toBe('https://api.github.com/repos/MichalDakowicz/sonar/releases/latest');
    expect(normalizeRelease({ tag_name: 'v2.0' })?.pageUrl).toBe(RELEASES_PAGE_URL);
    expect(RELEASES_PAGE_URL).toBe('https://github.com/MichalDakowicz/sonar/releases/latest');
  });

  it('reads the installed version from Expo config', () => {
    const config = Constants.expoConfig;
    try {
      Constants.expoConfig = { ...config, name: 'Sonar', slug: 'sonar', version: '2.10.3' };
      expect(currentAppVersion()).toBe('2.10.3');
      Constants.expoConfig = null;
      expect(currentAppVersion()).toBe('0.0.0');
    } finally {
      Constants.expoConfig = config;
    }
  });
});

describe('shouldShowUpdateNotice', () => {
  const release = normalizeRelease({ tag_name: 'v2.1.0' })!;

  it('shows an undismissed newer release', () => {
    expect(shouldShowUpdateNotice(release, '2.0.0', null)).toBe(true);
  });

  it('keeps the dismissed version hidden across launches', () => {
    expect(shouldShowUpdateNotice(release, '2.0.0', '2.1.0')).toBe(false);
  });

  it('shows a newer release after an earlier version was dismissed', () => {
    expect(shouldShowUpdateNotice(release, '2.0.0', '2.0.1')).toBe(true);
  });

  it('does not prompt for missing, installed or older releases', () => {
    expect(shouldShowUpdateNotice(null, '2.0.0', null)).toBe(false);
    expect(shouldShowUpdateNotice(release, '2.1.0', null)).toBe(false);
    expect(shouldShowUpdateNotice(release, '2.10.0', null)).toBe(false);
  });
});

describe('fetchLatestRelease', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('fetches and normalizes the app release', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ tag_name: 'v3.0' }) });
    expect((await fetchLatestRelease())?.version).toBe('3.0');
    expect(globalThis.fetch).toHaveBeenCalledWith(LATEST_RELEASE_API, expect.objectContaining({
      headers: { Accept: 'application/vnd.github+json' },
      signal: expect.any(AbortSignal),
    }));
  });

  it('reports failed checks so Settings can offer a retry', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(fetchLatestRelease()).rejects.toThrow('GitHub releases request failed (503)');
  });

  it('aborts a stalled check and clears its timer', async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn().mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const result = expect(fetchLatestRelease(25)).rejects.toThrow('aborted');
    jest.advanceTimersByTime(25);
    await result;
    expect(jest.getTimerCount()).toBe(0);
  });
});
