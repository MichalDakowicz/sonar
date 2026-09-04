import type { Album, AlbumStatus } from '@/types/album';

/**
 * Where a release sits on your shelf. Unlike formats these are mutually
 * exclusive, and only `Collection` counts as owned — every stat that talks
 * about "your collection" filters on that, because a wishlist entry is a plan,
 * not a record you have.
 *
 * The colours ride along here (they are data properties of the status, and the
 * cards, chips and pills must agree on them) but the icon does not: `lib/` stays
 * free of React so these rules can be tested without a renderer. Glyphs live in
 * components/media/Glyphs.
 *
 * `tint` is a real colour, not `color + '22'`. That trick only works on hex, and
 * Collection's used to be `hsl(160 84% 39%)` — concatenating onto that produced
 * an unparseable string, which React Native resolved to opaque green, so the
 * selected Collection chip drew a solid block over its own icon and label.
 */
export const STATUSES: { value: AlbumStatus; label: string; color: string; tint: string }[] = [
  { value: 'Collection', label: 'Collection', color: '#10b981', tint: 'rgba(16,185,129,0.16)' },
  { value: 'Wishlist', label: 'Wishlist', color: '#ec4899', tint: 'rgba(236,72,153,0.16)' },
  { value: 'Pre-order', label: 'Pre-order', color: '#3b82f6', tint: 'rgba(59,130,246,0.16)' },
];

const BY_VALUE = new Map(STATUSES.map((status) => [status.value, status]));

export function statusMeta(status: AlbumStatus) {
  return BY_VALUE.get(status) ?? STATUSES[0];
}

/**
 * Legacy rows predate the status field entirely; those albums were the
 * collection, so an absent value reads as `Collection` rather than as unknown.
 */
export function normalizeStatus(raw: unknown): AlbumStatus {
  const value = typeof raw === 'string' ? raw.trim() : '';
  return BY_VALUE.has(value as AlbumStatus) ? (value as AlbumStatus) : 'Collection';
}

export function isOwned(album: Album): boolean {
  return album.status === 'Collection';
}

export function isWishlist(album: Album): boolean {
  return album.status === 'Wishlist';
}

export function isPreOrder(album: Album): boolean {
  return album.status === 'Pre-order';
}
