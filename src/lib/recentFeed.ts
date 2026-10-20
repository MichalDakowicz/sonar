type RecentItem = { id: string; createdAt: string };

/** Keep one bounded, ordered page without mutating the cached snapshot. */
export function mergeRecent<T extends RecentItem>(list: readonly T[], item: T, limit: number): T[] {
  return [...list.filter(previous => previous.id !== item.id), item]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, limit));
}

/** INSERTs carry complete rows. Anything incomplete needs the normal fetch path. */
export function isActivityInsert(value: unknown, domain: 'album' | 'book'): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || !row.id || typeof row.user_id !== 'string' || !row.user_id ||
      typeof row.type !== 'string' || typeof row.created_at !== 'string' || !Number.isFinite(Date.parse(row.created_at)) ||
      typeof row[`${domain}_title`] !== 'string') return false;
  for (const key of [`${domain}_id`, `${domain}_key`]) {
    if (row[key] !== null && typeof row[key] !== 'string') return false;
  }
  return row.details === null || (typeof row.details === 'object' && !Array.isArray(row.details));
}
