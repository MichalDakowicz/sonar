import { startPolling } from './qrPoll';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

/** Lets the promise a tick returned settle, then runs the timer it scheduled. */
async function advance(ms: number) {
  await jest.advanceTimersByTimeAsync(ms);
}

describe('startPolling', () => {
  it('asks again after each answer, one at a time', async () => {
    const tick = jest.fn().mockResolvedValue('continue');
    startPolling(tick, { intervalMs: 100 });
    await advance(350);
    expect(tick).toHaveBeenCalledTimes(3);
  });

  it('does not start the next request before the last has answered', async () => {
    let release: (value: 'continue') => void = () => {};
    const tick = jest.fn(() => new Promise<'continue'>((resolve) => (release = resolve)));
    startPolling(tick, { intervalMs: 100 });
    await advance(1000);
    expect(tick).toHaveBeenCalledTimes(1);
    release('continue');
    await advance(150);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('stops when told to', async () => {
    const tick = jest.fn().mockResolvedValue('stop');
    startPolling(tick, { intervalMs: 100 });
    await advance(1000);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('stops when cancelled, even with a request in flight', async () => {
    let release: (value: 'continue') => void = () => {};
    const tick = jest.fn(() => new Promise<'continue'>((resolve) => (release = resolve)));
    const cancel = startPolling(tick, { intervalMs: 100 });
    await advance(100);
    cancel();
    release('continue');
    await advance(1000);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('never starts if cancelled at once', async () => {
    const tick = jest.fn().mockResolvedValue('continue');
    startPolling(tick, { intervalMs: 100 })();
    await advance(1000);
    expect(tick).not.toHaveBeenCalled();
  });

  it('rides out a couple of failures and gives up on a run of them', async () => {
    const onGiveUp = jest.fn();
    const tick = jest.fn().mockRejectedValue(new Error('offline'));
    startPolling(tick, { intervalMs: 100, maxFailures: 3, onGiveUp });
    await advance(1000);
    expect(tick).toHaveBeenCalledTimes(3);
    expect(onGiveUp).toHaveBeenCalledTimes(1);
  });

  it('counts failures in a row, not in total', async () => {
    const onGiveUp = jest.fn();
    const tick = jest
      .fn()
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValueOnce('continue')
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValueOnce('stop');
    startPolling(tick, { intervalMs: 100, maxFailures: 2, onGiveUp });
    await advance(1000);
    expect(tick).toHaveBeenCalledTimes(4);
    expect(onGiveUp).not.toHaveBeenCalled();
  });

  it('does not report a give-up after being cancelled', async () => {
    const onGiveUp = jest.fn();
    const cancel = startPolling(jest.fn().mockRejectedValue(new Error('x')), {
      intervalMs: 100,
      maxFailures: 1,
      onGiveUp,
    });
    cancel();
    await advance(1000);
    expect(onGiveUp).not.toHaveBeenCalled();
  });
});
