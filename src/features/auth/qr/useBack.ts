import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/**
 * Back, or home when there is nowhere to go back to. These screens are opened from
 * a button, but also by a link or a reload on the web, where `back()` does nothing.
 */
export function useBack(): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/' as Href);
  }, [router]);
}
