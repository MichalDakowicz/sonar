import { Shuffle } from 'lucide-react-native';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AlbumCard } from '@/components/media/AlbumCard';
import { Sheet, type BottomSheetModal } from '@/components/ui/Sheet';
import { artistsToDisplayString } from '@/lib/utils';
import { COLORS } from '@/theme/colors';
import type { Album, Ratings } from '@/types/album';

type RandomSpinSheetProps = {
  albums: Album[];
  ratingsFor?: (album: Album) => Ratings | null;
  onSelect: (album: Album) => void;
  onLogSpin?: (album: Album) => void;
};

/** How long the reel flicks before it settles, and how fast it swaps covers. */
const REEL_MS = 1400;
const TICK_MS = 90;

/**
 * "Put something on" — the legacy random-spin modal.
 *
 * The reel is not decoration: picking blind from a shelf of hundreds feels
 * arbitrary, and watching it flick through real covers makes the result feel
 * drawn rather than decided. It settles on a seeded pick from the pool the
 * collection screen already filtered, so a narrowed shelf narrows the draw.
 */
export const RandomSpinSheet = forwardRef<BottomSheetModal, RandomSpinSheetProps>(function RandomSpinSheet(
  { albums, ratingsFor, onSelect, onLogSpin },
  ref,
) {
  const [index, setIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopAt = useRef(0);

  const spin = () => {
    if (albums.length === 0) return;
    setSpinning(true);
    stopAt.current = Date.now() + REEL_MS;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setIndex(Math.floor(Math.random() * albums.length));
      if (Date.now() >= stopAt.current) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setSpinning(false);
      }
    }, TICK_MS);
  };

  // Stop the reel when the sheet goes away, or the interval keeps ticking on a
  // dismissed sheet and re-renders a screen nobody is looking at.
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const album = albums[Math.min(index, Math.max(albums.length - 1, 0))];

  return (
    <Sheet ref={ref} snapPoints={['70%']} onChange={(snap) => (snap >= 0 ? spin() : undefined)}>
      <View className="items-center gap-5 p-5">
        <Text className="text-lg font-bold text-foreground">What should I put on?</Text>

        {!album ? (
          <Text className="py-10 text-center text-sm text-muted-foreground">
            Nothing to draw from — the picker only uses records in your collection that match the filters you have on.
          </Text>
        ) : (
          <>
            <View className="w-full max-w-[280px]">
              <AlbumCard
                album={album}
                variant="cover"
                ratings={ratingsFor?.(album) ?? null}
                readOnly
                // No crossfade while the reel is running: a 200ms transition per
                // 90ms tick just renders mud.
                coverTransitionMs={spinning ? 0 : 200}
              />
            </View>

            <View className="items-center gap-1">
              <Text numberOfLines={2} className="text-center text-base font-bold text-foreground">
                {album.title}
              </Text>
              <Text numberOfLines={1} className="text-sm text-muted-foreground">
                {artistsToDisplayString(album.artist)}
              </Text>
            </View>

            <View className="w-full gap-2">
              <Pressable
                onPress={() => onSelect(album)}
                disabled={spinning}
                className="items-center rounded-full bg-primary py-3 active:opacity-80"
                style={{ opacity: spinning ? 0.5 : 1 }}
              >
                <Text className="font-semibold text-primary-foreground">Open it</Text>
              </Pressable>

              {!!onLogSpin && (
                <Pressable
                  onPress={() => onLogSpin(album)}
                  disabled={spinning}
                  className="items-center rounded-full border border-border py-3 active:opacity-80"
                  style={{ opacity: spinning ? 0.5 : 1 }}
                >
                  <Text className="font-medium text-foreground">Log it as playing now</Text>
                </Pressable>
              )}

              <Pressable
                onPress={spin}
                disabled={spinning}
                className="flex-row items-center justify-center gap-2 py-2 active:opacity-70"
              >
                <Shuffle size={15} color={COLORS.muted} />
                <Text className="text-sm text-muted-foreground">{spinning ? 'Spinning…' : 'Draw again'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Sheet>
  );
});
