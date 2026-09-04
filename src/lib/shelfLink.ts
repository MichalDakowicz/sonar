import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * Absolute link to someone's public shelf. On web that is a real URL a friend
 * can open in any browser; on device it is the app's deep link, which is the
 * only thing that resolves back into the installed app.
 */
export function publicShelfUrl(userId: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/u/${userId}`;
  }
  return Linking.createURL(`/u/${userId}`);
}
