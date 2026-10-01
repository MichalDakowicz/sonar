import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { QUIET_ZONE, qrMatrix, qrPath } from '@/lib/qrMatrix';

type QrCodeProps = {
  value: string;
  /** Side of the square, with its quiet zone, in dp. */
  size?: number;
  label?: string;
};

/**
 * A QR code, drawn. Always black on white whatever the theme is: a scanner reads
 * contrast, not taste, and plenty of them fail on an inverted code — which is why
 * these two are keywords rather than tokens.
 */
export function QrCode({ value, size = 232, label = 'QR code' }: QrCodeProps) {
  const { path, modules } = useMemo(() => {
    const matrix = qrMatrix(value);
    return { path: qrPath(matrix), modules: matrix.length };
  }, [value]);
  const span = modules + QUIET_ZONE * 2;
  // A whole number of dp per module, so neighbouring squares meet on a pixel edge
  // instead of leaving a hairline between rows.
  const side = Math.max(1, Math.floor(size / span)) * span;

  return (
    <Svg
      width={side}
      height={side}
      viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${span} ${span}`}
      accessibilityLabel={label}
    >
      <Rect x={-QUIET_ZONE} y={-QUIET_ZONE} width={span} height={span} fill="white" />
      <Path d={path} fill="black" />
    </Svg>
  );
}
