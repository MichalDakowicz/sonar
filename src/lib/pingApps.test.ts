import {
  HANDOFF_TTL_MS,
  isGenuine,
  mainActivityOf,
  normalizeSigner,
  PING_APPS,
  pingApp,
  readReturn,
  readShareRequest,
  returnUrl,
  shareRequestUrl,
  siblingsOf,
  stateFrom,
  type PendingHandoff,
} from './pingApps';

const STATE = 'a'.repeat(48);
const radar = pingApp('radar')!;
const lidar = pingApp('lidar')!;

/** Mirrors how expo-router hands over the query of a link. */
function paramsOf(url: string): Record<string, string> {
  const query = url.split('?')[1] ?? '';
  return Object.fromEntries(
    query.split('&').map((pair) => {
      const [key, value = ''] = pair.split('=');
      return [key, decodeURIComponent(value)];
    }),
  );
}

describe('the family', () => {
  it('knows every app by its scheme and nothing else', () => {
    expect(pingApp('sonar')?.androidPackage).toBe('com.michaldakowicz.sonar');
    expect(pingApp('vidar')).toBeNull();
    expect(pingApp(undefined)).toBeNull();
  });

  it('leaves the asking app out of its own siblings', () => {
    const keys = siblingsOf('pulsar').map((app) => app.key);
    expect(keys).toEqual(['radar', 'lidar', 'sonar', 'cellar', 'bazaar']);
  });

  it('names the activity Expo prebuild generates', () => {
    expect(mainActivityOf(lidar)).toBe('com.michaldakowicz.lidar.MainActivity');
  });

  // The manifest plugin cannot import this module, so it keeps its own list.
  // A sibling missing from it is invisible to this app on Android 11+.
  it('matches the packages the manifest plugin makes visible', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PING_PACKAGES } = require('../../plugins/withPingSiblings');
    expect(PING_PACKAGES).toEqual(PING_APPS.map((app) => app.androidPackage));
  });

  it('writes a query for every sibling and none for itself, once', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { addPingQueries } = require('../../plugins/withPingSiblings');
    type Entry = { $: Record<string, string> };
    const manifest: { queries: { intent: object[]; package?: Entry[] }[] } = { queries: [{ intent: [{}] }] };
    addPingQueries(manifest, 'com.michaldakowicz.lidar');
    addPingQueries(manifest, 'com.michaldakowicz.lidar');
    const names = manifest.queries[0].package?.map((entry) => entry.$['android:name']);
    expect(names).toEqual(siblingsOf('lidar').map((app) => app.androidPackage));
    expect(manifest.queries[0].intent).toHaveLength(1);
  });
});

describe('signing certificates', () => {
  // What keytool prints for the stock debug keystore Expo prebuild ships — public.
  const TEMPLATE_DEBUG = 'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C';

  it('pins every app to at least one well-formed SHA-256', () => {
    for (const app of PING_APPS) {
      expect(app.signers.length).toBeGreaterThan(0);
      for (const signer of app.signers) expect(signer).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  // The template key is public, so pinning it vouches for nothing. Every app now has a
  // private key; sliding any of them back to the template would quietly undo its pin.
  it('keeps every app off the template debug key', () => {
    for (const app of PING_APPS) {
      expect(app.signers).not.toContain(normalizeSigner(TEMPLATE_DEBUG));
      expect(isGenuine(app, [TEMPLATE_DEBUG])).toBe(false);
    }
  });

  it('shares one family key between the four apps that were on the debug key', () => {
    const family = new Set(['lidar', 'sonar', 'pulsar', 'cellar', 'bazaar'].map((key) => pingApp(key)!.signers.join()));
    expect(family.size).toBe(1);
    expect(radar.signers.join()).not.toBe([...family][0]);
  });

  it('spells a digest the same however it is written', () => {
    expect(normalizeSigner(TEMPLATE_DEBUG)).toBe(TEMPLATE_DEBUG.replace(/:/g, '').toLowerCase());
    expect(normalizeSigner('  AB:cd ')).toBe('abcd');
  });

  describe('isGenuine', () => {
    const [radarSigner] = radar.signers;

    it('accepts the certificate the app ships under, in any spelling', () => {
      expect(isGenuine(radar, [radarSigner])).toBe(true);
      expect(isGenuine(radar, [radarSigner.toUpperCase()])).toBe(true);
      expect(isGenuine(lidar, [lidar.signers[0].toUpperCase()])).toBe(true);
    });

    it('refuses a certificate that belongs to another app', () => {
      expect(isGenuine(lidar, [radarSigner])).toBe(false);
      expect(isGenuine(radar, ['0'.repeat(64)])).toBe(false);
    });

    it('refuses an app signed with anything it did not pin, even beside a pinned one', () => {
      expect(isGenuine(radar, [radarSigner, '0'.repeat(64)])).toBe(false);
    });

    it('refuses when nothing was found', () => {
      expect(isGenuine(radar, [])).toBe(false);
    });

    it('refuses an app that has no pin, rather than waving it through', () => {
      expect(isGenuine({ ...radar, signers: [] }, [radarSigner])).toBe(false);
    });
  });
});

describe('stateFrom', () => {
  it('writes the bytes as lowercase hex', () => {
    expect(stateFrom(new Uint8Array(16).fill(255))).toBe('f'.repeat(32));
  });

  it('refuses too few bytes to be unguessable', () => {
    expect(() => stateFrom(new Uint8Array(8))).toThrow();
  });
});

describe('readShareRequest', () => {
  it('reads back a request built for this donor', () => {
    const params = paramsOf(shareRequestUrl(radar, lidar, STATE));
    expect(readShareRequest(params, 'radar')).toEqual({ requester: lidar, state: STATE });
  });

  it('never answers itself', () => {
    expect(readShareRequest({ for: 'radar', state: STATE }, 'radar')).toBeNull();
  });

  it('refuses an app outside the family', () => {
    expect(readShareRequest({ for: 'evil', state: STATE }, 'radar')).toBeNull();
  });

  it('refuses a missing or malformed state', () => {
    expect(readShareRequest({ for: 'lidar' }, 'radar')).toBeNull();
    expect(readShareRequest({ for: 'lidar', state: 'short' }, 'radar')).toBeNull();
    expect(readShareRequest({ for: 'lidar', state: `${STATE}&x=1` }, 'radar')).toBeNull();
  });

  it('takes the first of a repeated param', () => {
    expect(readShareRequest({ for: ['lidar', 'sonar'], state: STATE }, 'radar')?.requester).toBe(lidar);
  });
});

describe('readReturn', () => {
  const now = 1_000_000;
  const pending: PendingHandoff = { state: STATE, donor: 'radar', at: now };

  it('accepts the token that answers the open request', () => {
    const params = paramsOf(returnUrl(lidar, STATE, { tokenHash: 'deadbeef'.repeat(7) }));
    expect(readReturn(params, pending, now + 1000)).toEqual({
      kind: 'token',
      tokenHash: 'deadbeef'.repeat(7),
      donor: radar,
    });
  });

  it('carries a failure through', () => {
    const params = paramsOf(returnUrl(lidar, STATE, { failure: 'signed-out' }));
    expect(readReturn(params, pending, now)).toEqual({ kind: 'failure', failure: 'signed-out', donor: radar });
  });

  it('reads anything unrecognised as a plain failure', () => {
    expect(readReturn({ state: STATE, error: 'nonsense' }, pending, now)).toMatchObject({ failure: 'failed' });
    expect(readReturn({ state: STATE, token_hash: 'x' }, pending, now)).toMatchObject({ failure: 'failed' });
  });

  it('ignores an answer when nothing was asked', () => {
    expect(readReturn({ state: STATE, token_hash: 'deadbeef'.repeat(7) }, null, now)).toEqual({ kind: 'stale' });
  });

  it('ignores an answer to a different request — including its errors', () => {
    const other = 'b'.repeat(48);
    expect(readReturn({ state: other, token_hash: 'deadbeef'.repeat(7) }, pending, now)).toEqual({ kind: 'stale' });
    expect(readReturn({ state: other, error: 'signed-out' }, pending, now)).toEqual({ kind: 'stale' });
  });

  it('ignores an answer that comes too late', () => {
    const late = now + HANDOFF_TTL_MS + 1;
    expect(readReturn({ state: STATE, token_hash: 'deadbeef'.repeat(7) }, pending, late)).toEqual({ kind: 'stale' });
  });

  it('ignores an answer stamped before its request, as after a clock change', () => {
    expect(readReturn({ state: STATE, token_hash: 'deadbeef'.repeat(7) }, pending, now - 1)).toEqual({
      kind: 'stale',
    });
  });
});
