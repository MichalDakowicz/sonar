import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { goBackOrHome } from '@/lib/utils';

// Shared floating back pill (same treatment as DetailHero/PersonHero) for
// screens without a backdrop hero of their own - genre/studio landing pages.
export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => goBackOrHome(router)}
      className={`h-10 w-10 items-center justify-center rounded-full bg-black/50 ${className ?? ''}`}
    >
      <ArrowLeft size={22} color="#fff" />
    </Pressable>
  );
}
