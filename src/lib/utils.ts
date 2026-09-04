import { type ClassValue, clsx } from 'clsx';
import type { useRouter } from 'expo-router';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Deep-linked/direct-nav screens (album detail, release detail) have no back
// history — fall back to the collection instead of a no-op back().
export function goBackOrHome(router: ReturnType<typeof useRouter>): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function formatRelativeTime(timestamp: string | number | null | undefined): string | null {
  if (!timestamp) return null;

  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  if (!Number.isFinite(time)) return null;
  const diff = Date.now() - time;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(time).toLocaleDateString();
}

/** Artists as one line. A release can credit several, and the card shows all. */
export function artistsToDisplayString(artist: string[] | null | undefined): string {
  return (artist ?? []).filter(Boolean).join(', ');
}

/**
 * The year alone, whatever precision the date came at — Spotify hands back
 * '1969', '1969-08' and '1969-08-08' for different releases.
 */
export function releaseYear(releaseDate: string | null | undefined): string {
  return releaseDate ? releaseDate.slice(0, 4) : '';
}

/** Full date when the precision supports one, else whatever is known. */
export function formatReleaseDate(releaseDate: string | null | undefined, precision?: string | null): string {
  if (!releaseDate) return '';
  if (precision === 'year' || releaseDate.length === 4) return releaseDate;
  const date = new Date(releaseDate);
  if (Number.isNaN(date.getTime())) return releaseDate;
  if (precision === 'month' || releaseDate.length === 7) {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Money as typed, without pretending to know the user's currency. */
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '';
  return price.toFixed(2).replace(/\.00$/, '');
}
