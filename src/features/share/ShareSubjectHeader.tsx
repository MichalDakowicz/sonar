import { Text, View } from 'react-native';

import { CoverImage } from '@/components/media/CoverImage';
import type { ShareSubject } from '@/features/share/useShareResolution';

/**
 * What the other app handed over, drawn once at the top of the sheet so it
 * stays visible while the tabs change underneath it — the shared song is the
 * reason you are here even once you have pivoted to its artist's back catalogue.
 */
export function ShareSubjectHeader({ subject }: { subject: ShareSubject }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-16 w-16 overflow-hidden rounded-lg bg-secondary">
        <CoverImage uri={subject.coverUrl} iconSize={22} />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Shared from Spotify
        </Text>
        <Text numberOfLines={1} className="text-base font-bold text-foreground">
          {subject.headline}
        </Text>
        {!!subject.subline && (
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {subject.subline}
          </Text>
        )}
      </View>
    </View>
  );
}
