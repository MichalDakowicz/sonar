import { canShareSignIn } from './pingBackends';
import { pingApp } from './pingApps';

describe('staged backend migration', () => {
  it('allows each pair of migrated apps in both directions', () => {
    for (const self of ['lidar', 'sonar', 'pulsar', 'bazaar'] as const) {
      for (const sibling of ['lidar', 'sonar', 'pulsar', 'bazaar'] as const) {
        expect(canShareSignIn(self, sibling)).toBe(self !== sibling);
      }
    }
  });
  it('excludes the separate products from sign-in', () => {
    expect(pingApp('radar')).toBeNull();
    expect(pingApp('cellar')).toBeNull();
  });
});
