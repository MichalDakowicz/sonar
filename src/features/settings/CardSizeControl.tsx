import { useCollectionPrefs, type GridSize } from '@/store/collectionPrefs';

import { Segmented } from './Segmented';
import { SettingLabel } from './SettingsSection';

const OPTIONS: { value: GridSize; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
];

/**
 * How big the covers are in the collection grid. Device-local (MMKV via the
 * prefs store), not a server setting: it is about the screen in your hand.
 */
export function CardSizeControl() {
  const { gridSize, setGridSize } = useCollectionPrefs();
  return (
    <>
      <SettingLabel title="Cover size" description="How many records fit across the grid" />
      <Segmented options={OPTIONS} value={gridSize} onChange={setGridSize} />
    </>
  );
}
