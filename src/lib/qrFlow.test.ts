import {
  approverAfterStep,
  MAX_RENEWALS,
  requesterAfterStep,
  shouldRenewOffer,
  shouldRenewStart,
  type ApproverState,
  type RequesterState,
} from './qrFlow';

const SOON = '2030-01-01T00:00:00.000Z';
const REQUESTER = { label: 'Radar in Chrome on Windows', country: 'PL' };

const showing = (renewals = 0): Extract<ApproverState, { phase: 'showing' }> => ({
  phase: 'showing',
  id: 'a',
  payload: 'p',
  matchCode: '42',
  expiresAt: SOON,
  renewals,
});

const confirming = (deciding: 'approve' | 'decline' | null = null): Extract<ApproverState, { phase: 'confirm' }> => ({
  phase: 'confirm',
  id: 'a',
  matchCode: '42',
  requester: REQUESTER,
  expiresAt: SOON,
  deciding,
});

describe('approverAfterStep', () => {
  it('puts a request in front of the person who showed the code', () => {
    const step = { kind: 'confirm', matchCode: '42', requester: REQUESTER, expiresAt: SOON } as const;
    expect(approverAfterStep(showing(), step)).toEqual(confirming());
  });

  it('keeps the verdict in flight when the request refreshes', () => {
    const step = { kind: 'confirm', matchCode: '42', requester: REQUESTER, expiresAt: SOON } as const;
    expect(approverAfterStep(confirming('approve'), step)).toEqual(confirming('approve'));
  });

  it('never goes back to waiting once a request has arrived', () => {
    const state = confirming();
    expect(approverAfterStep(state, { kind: 'showing', matchCode: '42', expiresAt: SOON })).toBe(state);
  });

  it('finishes on approval, refusal and expiry', () => {
    expect(approverAfterStep(confirming(), { kind: 'approved' })).toEqual({ phase: 'approved' });
    expect(approverAfterStep(confirming(), { kind: 'denied' })).toEqual({ phase: 'declined' });
    expect(approverAfterStep(confirming(), { kind: 'expired' })).toEqual({ phase: 'ended', reason: 'expired' });
  });

  it('ignores a late answer after the pairing is over', () => {
    for (const state of [{ phase: 'idle' }, { phase: 'approved' }, { phase: 'declined' }] as ApproverState[]) {
      expect(approverAfterStep(state, { kind: 'expired' })).toBe(state);
    }
  });
});

describe('shouldRenewOffer', () => {
  it('replaces a code nobody scanned, a few times', () => {
    expect(shouldRenewOffer(showing(0), { kind: 'expired' })).toBe(true);
    expect(shouldRenewOffer(showing(MAX_RENEWALS - 1), { kind: 'expired' })).toBe(true);
    expect(shouldRenewOffer(showing(MAX_RENEWALS), { kind: 'expired' })).toBe(false);
  });

  it('does not replace a request somebody was already deciding on', () => {
    expect(shouldRenewOffer(confirming(), { kind: 'expired' })).toBe(false);
  });

  it('does not replace a code that is still good', () => {
    expect(shouldRenewOffer(showing(), { kind: 'showing', matchCode: '42', expiresAt: SOON })).toBe(false);
  });
});

const browserCode = (renewals = 0): Extract<RequesterState, { phase: 'showing' }> => ({
  phase: 'showing',
  id: 'a',
  payload: 'p',
  matchCode: '42',
  expiresAt: SOON,
  renewals,
});

describe('requesterAfterStep', () => {
  it('moves from showing to waiting on a decision once scanned', () => {
    expect(requesterAfterStep(browserCode(), { kind: 'deciding', matchCode: '42', expiresAt: SOON })).toEqual({
      phase: 'deciding',
      id: 'a',
      matchCode: '42',
      expiresAt: SOON,
    });
  });

  it('stays put while nothing has happened', () => {
    const state = browserCode();
    expect(requesterAfterStep(state, { kind: 'showing', matchCode: '42', expiresAt: SOON })).toBe(state);
  });

  it('signs in on a token and stops on a refusal', () => {
    expect(requesterAfterStep(browserCode(), { kind: 'token', tokenHash: 't' })).toEqual({ phase: 'signing-in' });
    expect(requesterAfterStep(browserCode(), { kind: 'denied' })).toEqual({ phase: 'denied' });
  });

  it('ignores a late answer after the pairing is over', () => {
    const state: RequesterState = { phase: 'denied' };
    expect(requesterAfterStep(state, { kind: 'token', tokenHash: 't' })).toBe(state);
  });
});

describe('shouldRenewStart', () => {
  it('replaces a browser code that ran out, a few times', () => {
    expect(shouldRenewStart(browserCode(0))).toBe(true);
    expect(shouldRenewStart(browserCode(MAX_RENEWALS))).toBe(false);
  });

  it('does not replace a code that was scanned', () => {
    expect(shouldRenewStart({ phase: 'deciding', id: 'a', matchCode: '42', expiresAt: SOON })).toBe(false);
  });
});
