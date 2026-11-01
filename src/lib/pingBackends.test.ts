import { canShareSignIn } from './pingBackends';

describe('staged backend migration', () => {
  it('allows local Lidar and Sonar handoff in both directions', () => {
    expect(canShareSignIn('lidar', 'sonar')).toBe(true);
    expect(canShareSignIn('sonar', 'lidar')).toBe(true);
  });
  it.each(['pulsar', 'bazaar'] as const)('blocks cloud %s in both directions', sibling => {
    for (const local of ['lidar', 'sonar'] as const) {
      expect(canShareSignIn(local, sibling)).toBe(false);
      expect(canShareSignIn(sibling, local)).toBe(false);
    }
  });
  it('keeps the cloud siblings together', () => {
    expect(canShareSignIn('pulsar', 'bazaar')).toBe(true);
  });
  it('never offers itself', () => expect(canShareSignIn('sonar', 'sonar')).toBe(false));
});
