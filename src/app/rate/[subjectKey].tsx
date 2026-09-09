import { useLocalSearchParams } from 'expo-router';

import { SubjectDetailScreen } from '@/features/ratings/SubjectDetailScreen';

/**
 * A song or an artist, by its rating key (`spotify:song:<id>`,
 * `spotify:artist:<id>`).
 *
 * Separate from `release/[albumKey]` because nothing here can be owned: there
 * is no shelf row, no format and no spin log behind a song or an artist, only
 * an opinion. Releases keep their own route, where ownership is half the screen.
 */
export default function RateRoute() {
  const { subjectKey } = useLocalSearchParams<{ subjectKey: string }>();
  return <SubjectDetailScreen subjectKey={subjectKey} />;
}
