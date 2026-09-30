import { Check, Download, RefreshCw } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { openDownload, UPDATES_SUPPORTED, useLatestRelease } from '@/hooks/useAppUpdate';
import { COLORS } from '@/theme/colors';

const MUTED = COLORS.muted;

/**
 * Manual counterpart to the launch notice (features/updates/UpdateNotice) -
 * once a user taps "Later" the notice stays gone for that version, so Settings
 * is where they come back to grab the build.
 */
export function AppUpdateControl() {
  const { installedVersion, release, hasUpdate, isFetching, isError, refetch } = useLatestRelease();

  const subtitle = () => {
    if (!UPDATES_SUPPORTED) return `Version ${installedVersion}`;
    if (isFetching) return 'Checking GitHub…';
    if (isError) return "Couldn't reach GitHub - tap to retry";
    if (hasUpdate) return `Version ${installedVersion} · ${release?.version} available`;
    return `Version ${installedVersion} · up to date`;
  };

  const icon = () => {
    if (isFetching) return <ActivityIndicator size="small" color={MUTED} />;
    if (hasUpdate) return <Download size={20} color={COLORS.accent} />;
    return UPDATES_SUPPORTED && !isError ? <Check size={20} color={MUTED} /> : <RefreshCw size={20} color={MUTED} />;
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hasUpdate ? 'Download update' : 'Check for updates'}
      onPress={() => {
        if (!UPDATES_SUPPORTED) return;
        if (hasUpdate) void openDownload(release);
        else void refetch();
      }}
      disabled={!UPDATES_SUPPORTED || isFetching}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-4 py-4"
      style={{ opacity: !UPDATES_SUPPORTED || isFetching ? 0.6 : 1 }}
    >
      {icon()}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{hasUpdate ? 'Download update' : 'Sonar'}</Text>
        <Text className="text-xs text-muted-foreground">{subtitle()}</Text>
      </View>
    </Pressable>
  );
}
