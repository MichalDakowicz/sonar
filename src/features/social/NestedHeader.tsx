import { useRouter } from 'expo-router';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentShell } from '@/components/layout/ContentShell';
import { MAX_W } from '@/hooks/useResponsive';
import { goBackOrHome } from '@/lib/utils';

type NestedHeaderProps = {
  title: string;
  /** Renders the ··· button; omitted screens get no trailing control. */
  onMore?: () => void;
  moreLabel?: string;
};

/**
 * Back-arrow header for the screens pushed out of the Social tab. Every control
 * is a 44px target — the audit finding the redesign was written against.
 */
export function NestedHeader({ title, onMore, moreLabel }: NestedHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="border-b border-border bg-background px-2 pb-2" style={{ paddingTop: insets.top + 8 }}>
      <ContentShell maxWidth={MAX_W.text}>
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={() => goBackOrHome(router)}
            accessibilityLabel="Back"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
          >
            <ChevronLeft size={24} color="hsl(0 0% 98%)" />
          </Pressable>
          <Text numberOfLines={1} className="flex-1 text-base font-bold tracking-tight text-foreground">
            {title}
          </Text>
          {!!onMore && (
            <Pressable
              onPress={onMore}
              accessibilityLabel={moreLabel ?? `More actions for ${title}`}
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
            >
              <MoreVertical size={20} color="hsl(0 0% 90%)" />
            </Pressable>
          )}
        </View>
      </ContentShell>
    </View>
  );
}
