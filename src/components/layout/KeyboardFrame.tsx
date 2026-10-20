import type { ReactNode } from 'react';
import { usePathname } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';

/** Resize routed Android screens above the IME, including edge-to-edge windows.
 * iOS screens and modal sheets keep their own keyboard handling.
 */
export function KeyboardFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Pairing routes own their frame; nesting Android avoidance would lift twice.
  const pairing = pathname === '/qr-scan' || pathname === '/qr-show';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} enabled={Platform.OS === 'android' && !pairing} behavior="height">
      {children}
    </KeyboardAvoidingView>
  );
}
