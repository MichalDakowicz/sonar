import type { Album, AlbumStatus } from '@/types/album';

/**
 * Where a release sits on your shelf. Unlike formats these are mutually
 * exclusive, and only `Collection` counts as owned — every stat that talks
 * about "your collection" filters on that, because a wishlist entry is a plan,
 * not a record you have.
 *
 * The colour rides along here (it is a data property of the status, and the
 * cards, chips and pills must agree on it) but the icon does not: `lib/` stays
 * free of React so these rules can be tested without a renderer. Glyphs live in
 * components/media/formatIcons.
 */
export const STATUSES: { value: AlbumStatus; label: string; color: string }[] = [
  { value: 'Collection', label: 'Collection', color: 'hsl(160 84% 39%)' },
  { value: 'Wishlist', label: 'Wishlist', color: '#ec4899' },
  { value: 'Pre-order', label: 'Pre-order', color: '#3b82f6' },
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
