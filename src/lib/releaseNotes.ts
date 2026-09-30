// The markdown subset used by GitHub release notes.

export type InlineToken = { text: string; bold?: boolean; code?: boolean; url?: string };

type Block =
  | { kind: 'heading'; tokens: InlineToken[] }
  | { kind: 'bullet'; tokens: InlineToken[] }
  | { kind: 'paragraph'; tokens: InlineToken[] };

const INLINE_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|(https?:\/\/\S+)/g;

export function parseInline(raw: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let cursor = 0;

  for (const match of raw.matchAll(INLINE_PATTERN)) {
    const [full, linkText, linkUrl, boldStar, boldUnderscore, code, bareUrl] = match;
    const start = match.index ?? 0;
    if (start > cursor) tokens.push({ text: raw.slice(cursor, start) });

    if (linkText) tokens.push({ text: linkText, url: linkUrl });
    else if (boldStar || boldUnderscore) tokens.push({ text: boldStar ?? boldUnderscore, bold: true });
    else if (code) tokens.push({ text: code, code: true });
    else if (bareUrl) tokens.push({ text: shortenUrl(bareUrl), url: bareUrl });

    cursor = start + full.length;
  }

  if (cursor < raw.length) tokens.push({ text: raw.slice(cursor) });
  return tokens.filter((token) => token.text.length > 0);
}

/** `https://github.com/owner/repo/pull/1` -> `github.com/owner/repo/pull/1`. */
function shortenUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function parseMarkdown(body: string, maxBlocks = 14): Block[] {
  const blocks: Block[] = [];

  for (const line of body.split(/\r?\n/)) {
    if (blocks.length >= maxBlocks) break;

    const trimmed = line.trim();
    if (!trimmed || /^([-*_])\1{2,}$/.test(trimmed)) continue; // blank line or horizontal rule

    const heading = /^#{1,6}\s+(.*)$/.exec(trimmed);
    if (heading) {
      blocks.push({ kind: 'heading', tokens: parseInline(heading[1]) });
      continue;
    }

    const bullet = /^(?:[-*+]|\d+\.)\s+(.*)$/.exec(trimmed);
    if (bullet) {
      blocks.push({ kind: 'bullet', tokens: parseInline(bullet[1]) });
      continue;
    }

    blocks.push({ kind: 'paragraph', tokens: parseInline(trimmed) });
  }

  return blocks;
}
