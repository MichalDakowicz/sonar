import { QrNotice } from '@/components/qr/QrNotice';

import { QR_COPY } from './qrCopy';

type Ending = 'approved' | 'declined' | 'denied' | 'expired' | 'failed';

type QrEndingProps = {
  kind: Ending;
  /** The server's own words for a failure, when it gave any. */
  detail?: string;
  /** What to offer in place of Done, for the endings worth another go. */
  again?: { label: string; onPress: () => void };
  onDone: () => void;
};

const WORDS: Record<Ending, { title: string; body: string }> = {
  approved: { title: QR_COPY.approvedTitle, body: QR_COPY.approvedBody },
  declined: { title: QR_COPY.declinedTitle, body: QR_COPY.declinedBody },
  denied: { title: QR_COPY.deniedTitle, body: QR_COPY.deniedBody },
  expired: { title: QR_COPY.expiredTitle, body: QR_COPY.expiredBody },
  failed: { title: QR_COPY.failedTitle, body: QR_COPY.failedBody },
};

/** How a pairing ended, on either side, with the one thing worth doing next. */
export function QrEnding({ kind, detail, again, onDone }: QrEndingProps) {
  const { title, body } = WORDS[kind];
  const done = { label: QR_COPY.done, onPress: onDone };
  return <QrNotice title={title} body={kind === 'failed' && detail ? detail : body} primary={again ?? done} secondary={again ? done : undefined} />;
}
