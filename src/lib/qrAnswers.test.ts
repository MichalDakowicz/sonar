import { readClaim, readJoin, readOffer, readRedeem, readStart, readStatus } from './qrAnswers';
import { qrPayload } from './qrLogin';

const ID = '6f1c1f43-6a52-4a0f-9d0e-2f2d3b6a8c11';
const NONCE = 'AAAAAAAAAAAAAAAAAAAAAA';
const SOON = '2030-01-01T00:00:00.000Z';

describe('readStart', () => {
  it('reads the code a browser asked for', () => {
    expect(readStart({ id: ID, match_code: '42', expires_at: SOON })).toEqual({ id: ID, matchCode: '42', expiresAt: SOON });
  });

  it.each([
    ['no answer', undefined],
    ['an id that is not a pairing id', { id: 'nope', match_code: '42', expires_at: SOON }],
    ['a match code of the wrong shape', { id: ID, match_code: '4', expires_at: SOON }],
    ['an expiry that is not a date', { id: ID, match_code: '42', expires_at: 'soon' }],
    ['an array', [ID]],
  ])('refuses %s', (_name, answer) => {
    expect(readStart(answer)).toBeNull();
  });
});

describe('readOffer', () => {
  it('carries the payload the QR will show', () => {
    const offered = readOffer({ id: ID, nonce: NONCE, match_code: '07', expires_at: SOON });
    expect(offered?.payload).toBe(qrPayload({ mode: 'phone', id: ID, nonce: NONCE }));
    expect(offered).toMatchObject({ id: ID, matchCode: '07', expiresAt: SOON });
  });

  it('refuses a secret that could not be scanned back', () => {
    expect(readOffer({ id: ID, nonce: 'short', match_code: '07', expires_at: SOON })).toBeNull();
    expect(readOffer({ id: ID, match_code: '07', expires_at: SOON })).toBeNull();
    expect(readOffer({ id: ID, nonce: 'has.a.dot.in.it.......', match_code: '07', expires_at: SOON })).toBeNull();
  });
});

describe('readJoin', () => {
  it('reads the match code to look for on the other screen', () => {
    expect(readJoin({ match_code: '99', expires_at: SOON })).toEqual({ matchCode: '99', expiresAt: SOON });
    expect(readJoin({ match_code: '9', expires_at: SOON })).toBeNull();
  });
});

describe('readRedeem', () => {
  it('tells waiting for a scan from waiting for a decision', () => {
    expect(readRedeem({ state: 'pending', match_code: '42', expires_at: SOON })).toEqual({
      kind: 'showing',
      matchCode: '42',
      expiresAt: SOON,
    });
    expect(readRedeem({ state: 'claimed', match_code: '42', expires_at: SOON })).toEqual({
      kind: 'deciding',
      matchCode: '42',
      expiresAt: SOON,
    });
  });

  it('hands over a token only when there really is one', () => {
    expect(readRedeem({ state: 'approved', token_hash: 'abc' })).toEqual({ kind: 'token', tokenHash: 'abc' });
    expect(readRedeem({ state: 'approved' })).toBeNull();
    expect(readRedeem({ state: 'approved', token_hash: '' })).toBeNull();
    expect(readRedeem({ state: 'approved', token_hash: 7 })).toBeNull();
    expect(readRedeem({ state: 'approved', token_hash: 'x'.repeat(513) })).toBeNull();
  });

  it('reads a refusal and refuses anything it does not know', () => {
    expect(readRedeem({ state: 'denied' })).toEqual({ kind: 'denied' });
    expect(readRedeem({ state: 'consumed' })).toBeNull();
    expect(readRedeem({ state: 'pending' })).toBeNull();
    expect(readRedeem(null)).toBeNull();
    expect(readRedeem('approved')).toBeNull();
  });
});

describe('readClaim', () => {
  it('cleans what the requesting device says about itself', () => {
    const step = readClaim({
      match_code: '31',
      requester: { label: '  Radar\n in   Chrome ', country: 'pl' },
      expires_at: SOON,
    });
    expect(step).toEqual({
      kind: 'confirm',
      matchCode: '31',
      requester: { label: 'Radar in Chrome', country: 'PL' },
      expiresAt: SOON,
    });
  });

  it('still asks, with nothing to show, when the server knew nothing', () => {
    expect(readClaim({ match_code: '31', requester: null, expires_at: SOON })?.requester).toEqual({
      label: 'Unknown device',
      country: null,
    });
  });

  it('refuses a claim without a match code', () => {
    expect(readClaim({ requester: {}, expires_at: SOON })).toBeNull();
  });
});

describe('readStatus', () => {
  it('maps every state the server has', () => {
    expect(readStatus({ state: 'pending', match_code: '10', expires_at: SOON, requester: null })).toEqual({
      kind: 'showing',
      matchCode: '10',
      expiresAt: SOON,
    });
    expect(
      readStatus({ state: 'claimed', match_code: '10', expires_at: SOON, requester: { label: 'Phone', country: 'DE' } }),
    ).toMatchObject({ kind: 'confirm', requester: { label: 'Phone', country: 'DE' } });
    expect(readStatus({ state: 'approved' })).toEqual({ kind: 'approved' });
    expect(readStatus({ state: 'consumed' })).toEqual({ kind: 'approved' });
    expect(readStatus({ state: 'denied' })).toEqual({ kind: 'denied' });
    expect(readStatus({ state: 'expired' })).toEqual({ kind: 'expired' });
  });

  it('refuses a state it has never heard of', () => {
    expect(readStatus({ state: 'teleported' })).toBeNull();
    expect(readStatus({})).toBeNull();
  });
});
