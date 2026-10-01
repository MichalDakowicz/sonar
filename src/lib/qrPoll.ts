import { POLL_INTERVAL_MS } from './qrLogin';

export type PollOptions = {
  intervalMs?: number;
  /** Consecutive ticks that may throw before giving up. A tunnel is not an outage. */
  maxFailures?: number;
  onGiveUp?: (error: unknown) => void;
};

/**
 * Runs `tick` again and again, one at a time, until it answers `'stop'` or the
 * returned function is called. Sequential on purpose: a slow answer must not let
 * the next request overtake it, because a poll that redeems a token is not one to
 * issue twice.
 */
export function startPolling(tick: () => Promise<'continue' | 'stop'>, options: PollOptions = {}): () => void {
  const { intervalMs = POLL_INTERVAL_MS, maxFailures = 4, onGiveUp } = options;
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;

  const run = async () => {
    try {
      const next = await tick();
      failures = 0;
      if (next === 'stop') return;
    } catch (error) {
      failures += 1;
      if (failures >= maxFailures) {
        if (!cancelled) onGiveUp?.(error);
        return;
      }
    }
    if (!cancelled) timer = setTimeout(run, intervalMs);
  };

  timer = setTimeout(run, intervalMs);
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}
