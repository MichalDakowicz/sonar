// Stamps the exported favicon link with a content hash.
//
// Chrome keys its favicon cache by URL and ignores Cache-Control on it, so a
// redesigned mark keeps showing the previous icon in the tab until the profile's
// favicon database happens to evict it. Expo always emits `/favicon.ico`, so the
// only lever is the query string: `?v=<hash>` changes exactly when the bytes do,
// which forces the refetch once and never again.

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const hash = createHash('sha256')
  .update(await readFile(path.join(DIST, 'favicon.ico')))
  .digest('hex')
  .slice(0, 8);

const indexPath = path.join(DIST, 'index.html');
const html = await readFile(indexPath, 'utf8');
const stamped = html.replace('href="/favicon.ico"', `href="/favicon.ico?v=${hash}"`);

if (stamped === html) {
  console.warn('favicon link not found in dist/index.html — left untouched');
} else {
  await writeFile(indexPath, stamped);
  console.log(`stamped favicon.ico?v=${hash}`);
}
