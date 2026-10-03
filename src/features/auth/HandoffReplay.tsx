import { useReplayHandoffLink } from './useReplayHandoffLink';

/** Mounts the replay of a missed sibling sign-in link. Renders nothing. */
export function HandoffReplay() {
  useReplayHandoffLink();
  return null;
}
