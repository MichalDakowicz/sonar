import createQr from 'qrcode-generator';

/**
 * The dark modules of a QR code for `text`, row by row. Error correction M: a code
 * on a phone screen is read off glass, not off a scuffed label, so the extra
 * redundancy of Q or H would only make the squares smaller.
 */
export function qrMatrix(text: string): boolean[][] {
  const code = createQr(0, 'M');
  code.addData(text, 'Byte');
  code.make();
  const size = code.getModuleCount();
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => code.isDark(row, col)));
}

/**
 * One SVG path for all the dark modules, in module units: each horizontal run is a
 * single rectangle, so a 37 × 37 code is a few hundred short commands rather than
 * a thousand `<Rect>` elements.
 */
export function qrPath(matrix: readonly (readonly boolean[])[]): string {
  const commands: string[] = [];
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run]) run += 1;
      commands.push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  });
  return commands.join('');
}

/** Modules of blank margin the spec asks for on every side. */
export const QUIET_ZONE = 4;
