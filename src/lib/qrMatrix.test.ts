import { qrPayload } from './qrLogin';
import { qrMatrix, qrPath } from './qrMatrix';

describe('qrMatrix', () => {
  it('is square, and the same size for the same text', () => {
    const matrix = qrMatrix('ping-login:1:w:6f1c1f43-6a52-4a0f-9d0e-2f2d3b6a8c11');
    expect(matrix.length).toBeGreaterThan(20);
    for (const row of matrix) expect(row).toHaveLength(matrix.length);
    expect(qrMatrix('ping-login:1:w:6f1c1f43-6a52-4a0f-9d0e-2f2d3b6a8c11')).toEqual(matrix);
  });

  it('draws the three finder squares in their corners', () => {
    const matrix = qrMatrix('x');
    const last = matrix.length - 1;
    // The outer ring of a finder pattern is 7 modules of dark.
    for (let i = 0; i < 7; i += 1) {
      expect(matrix[0][i]).toBe(true);
      expect(matrix[i][0]).toBe(true);
      expect(matrix[0][last - i]).toBe(true);
      expect(matrix[last - i][0]).toBe(true);
    }
  });

  it('differs when the text does', () => {
    expect(qrMatrix('ping-login:1:w:a')).not.toEqual(qrMatrix('ping-login:1:w:b'));
  });

  it('fits a phone code in a small version', () => {
    const payload = qrPayload({
      mode: 'phone',
      id: '6f1c1f43-6a52-4a0f-9d0e-2f2d3b6a8c11',
      nonce: 'AAAAAAAAAAAAAAAAAAAAAA',
    });
    // Version 5 is 37 modules; anything past that and the squares get too small to scan across a table.
    expect(qrMatrix(payload).length).toBeLessThanOrEqual(37);
  });
});

describe('qrPath', () => {
  it('turns runs of dark modules into one rectangle each', () => {
    expect(qrPath([[true, true, false, true]])).toBe('M0 0h2v1h-2zM3 0h1v1h-1z');
  });

  it('puts every row at its own y', () => {
    expect(qrPath([[false], [true]])).toBe('M0 1h1v1h-1z');
  });

  it('is empty for an empty code', () => {
    expect(qrPath([[false, false]])).toBe('');
  });

  it('covers exactly the dark modules of a real code', () => {
    const matrix = qrMatrix('ping-login:1:w:6f1c1f43-6a52-4a0f-9d0e-2f2d3b6a8c11');
    const dark = matrix.flat().filter(Boolean).length;
    const area = [...qrPath(matrix).matchAll(/h(\d+)v1/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    expect(area).toBe(dark);
  });
});
