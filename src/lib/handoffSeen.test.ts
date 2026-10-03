import { claimHandoffLink, forgetHandoffLinks } from './handoffSeen';

beforeEach(forgetHandoffLinks);

describe('claimHandoffLink', () => {
  it('lets a link through once and refuses it after', () => {
    expect(claimHandoffLink('share-sign-in:aa')).toBe(true);
    expect(claimHandoffLink('share-sign-in:aa')).toBe(false);
  });

  it('keeps links apart by route and by state', () => {
    expect(claimHandoffLink('share-sign-in:aa')).toBe(true);
    expect(claimHandoffLink('sign-in-return:aa')).toBe(true);
    expect(claimHandoffLink('share-sign-in:bb')).toBe(true);
  });

  it('forgets the oldest once it is holding too many', () => {
    claimHandoffLink('first');
    for (let i = 0; i < 32; i++) claimHandoffLink(`link-${i}`);
    expect(claimHandoffLink('first')).toBe(true);
    expect(claimHandoffLink('link-31')).toBe(false);
  });
});
