// Rasterises assets/brand/logo.svg into every PNG app.json points at, so the
// brand only ever has one source of truth. Run after editing the brand SVGs:
//
//   npm run icons
//
// The mark is trimmed to its tight bounding box first, then re-padded per
// target - that keeps the optical size identical across icons even if the SVG's
// internal padding changes later.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRAND_DIR = path.join(ROOT, 'assets', 'brand');
const OUT_DIR = path.join(ROOT, 'assets', 'images');

// hsl(0 0% 3.9%) - the --background token, and what app.json already uses for
// the splash screen + Android adaptive icon background.
const BACKGROUND = { r: 9, g: 9, b: 11, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// Supersample well above the largest target so the trimmed edges stay smooth.
const RENDER_PX = 2048;

/**
 * `scale` is the fraction of the canvas the mark's bounding box fills. The
 * Android adaptive icons stay near 0.48 because Play Store masks crop to the
 * centre ~66% of the canvas; the standalone icons can run much closer to full
 * bleed.
 */
const TARGETS = [
  { file: 'icon.png', size: 1024, scale: 0.57, background: BACKGROUND },
  { file: 'favicon.png', size: 64, scale: 0.94 },
  { file: 'splash-icon.png', size: 512, scale: 0.91 },
  { file: 'android-icon-foreground.png', size: 1024, scale: 0.478 },
  { file: 'android-icon-monochrome.png', size: 1024, scale: 0.478, mono: '#FFFFFF' },
  { file: 'android-icon-background.png', size: 1024, solid: BACKGROUND },
];

async function trimmedMark(mono) {
  const source = mono
    ? (await readFile(path.join(BRAND_DIR, 'logo-mono.svg'), 'utf8')).replaceAll('currentColor', mono)
    : await readFile(path.join(BRAND_DIR, 'logo.svg'), 'utf8');

  return sharp(Buffer.from(source), { density: 600 })
    .resize({ width: RENDER_PX, height: RENDER_PX, fit: 'contain', background: TRANSPARENT })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
}

async function render({ file, size, scale, background, solid, mono }) {
  const canvas = sharp({
    create: { width: size, height: size, channels: 4, background: solid ?? background ?? TRANSPARENT },
  });

  if (!solid) {
    const content = Math.round(size * scale);
    const mark = await sharp(await trimmedMark(mono))
      .resize({ width: content, height: content, fit: 'contain', background: TRANSPARENT })
      .png()
      .toBuffer();

    canvas.composite([{ input: mark, gravity: 'center' }]);
  }

  await writeFile(path.join(OUT_DIR, file), await canvas.png({ compressionLevel: 9 }).toBuffer());
  return `${file}  ${size}x${size}`;
}

await mkdir(OUT_DIR, { recursive: true });
for (const target of TARGETS) {
  console.log('wrote', await render(target));
}
