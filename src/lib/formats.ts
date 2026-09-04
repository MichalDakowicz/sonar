import type { Format } from '@/types/album';

/**
 * The formats a release can be owned in, in shelf order. One table so the
 * chips, the filter facets, the card badges and the stats breakdown can never
 * disagree about the list.
 *
 * Free text in Postgres (albums.formats is text[]), not an enum: the list lives
 * here and gains entries faster than a Postgres type should be altered.
 *
 * No icons here on purpose — `lib/` stays free of React and react-native so the
 * pure rules are testable (and usable from a node script) without a renderer.
 * The glyph for each format lives in components/media/formatIcons.
 */
export const FORMATS: { value: Format; label: string }[] = [
  { value: 'Vinyl', label: 'Vinyl' },
  { value: 'CD', label: 'CD' },
  { value: 'Cassette', label: 'Cassette' },
  { value: 'Digital', label: 'Digital' },
];

const VALUES = new Set<Format>(FORMATS.map((format) => format.value));

export function isFormat(value: string): value is Format {
  return VALUES.has(value as Format);
}

/**
 * Coerces whatever a row holds into the format list. Legacy Firebase rows kept
 * a single string (`format: "Vinyl"`) before the app allowed owning a record on
 * several media, and rows with nothing at all mean Digital — that was the old
 * default and dropping it would empty the format facet for every early album.
 */
export function normalizeFormats(raw: unknown): Format[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const seen = new Set<Format>();
  for (const entry of list) {
    const value = String(entry).trim();
    if (isFormat(value)) seen.add(value);
  }
  if (seen.size === 0) return ['Digital'];
  // Returned in shelf order rather than write order, so two albums owned on the
  // same media always render their badges the same way round.
  return FORMATS.filter((format) => seen.has(format.value)).map((format) => format.value);
}

export function formatsToDisplayString(formats: Format[]): string {
  return formats.join(' • ');
}
