import { Database, Globe, Info, LogOut, Monitor } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ContentShell } from '@/components/layout/ContentShell';
import { NavIslands } from '@/components/layout/NavIslands';
import type { BottomSheetModal } from '@/components/ui/Sheet';
import { signOut } from '@/features/auth/authActions';
import { CardSizeControl } from '@/features/settings/CardSizeControl';
import { DataTools } from '@/features/settings/DataTools';
import { ImportExportSheet } from '@/features/settings/ImportExportSheet';
import { PrivacyControl } from '@/features/settings/PrivacyControl';
import { SettingsSection } from '@/features/settings/SettingsSection';
import { ThemeControl } from '@/features/settings/ThemeControl';
import { NestedHeader } from '@/features/social/NestedHeader';
import { useNavBarSpace } from '@/hooks/useNavBarSpace';
import { MAX_W, useCenteredContentStyle } from '@/hooks/useResponsive';
import { COLORS } from '@/theme/colors';

const MUTED = COLORS.muted;
const APP_VERSION = '2.1.0';

/**
 * App preferences, pushed from the gear on the Profile tab rather than owning a
 * tab of its own — settings are chrome you visit, not a place you live. Who you
 * are (avatar, name, shelf link) lives on Profile; what is left here is device
 * and account preferences.
 *
 * Two of these are shared with Radar and say so: visibility and theme are
 * columns on the one `user_settings` row, because it is one account.
 */
export default function Settings() {
  const contentStyle = useCenteredContentStyle(MAX_W.text);
  const navBarSpace = useNavBarSpace();
  const importExportRef = useRef<BottomSheetModal>(null);

  return (
    <View className="flex-1 bg-background">
      <NestedHeader title="Settings" />
      <ContentShell fill maxWidth={MAX_W.text}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-10 px-6 pt-6"
          contentContainerStyle={[contentStyle, { paddingBottom: navBarSpace + 16 }]}
        >
          <SettingsSection icon={<Globe size={18} color={MUTED} />} title="Privacy">
            <PrivacyControl />
            <Text className="text-xs text-muted-foreground">
              Shared with Radar: this one switch decides who can see your shelf in both apps.
            </Text>
          </SettingsSection>

          <SettingsSection icon={<Monitor size={18} color={MUTED} />} title="Appearance">
            <ThemeControl />
            <CardSizeControl />
          </SettingsSection>

          <SettingsSection icon={<Database size={18} color={MUTED} />} title="Data">
            <DataTools onOpenImportExport={() => importExportRef.current?.present()} />
          </SettingsSection>

          <SettingsSection icon={<Info size={18} color={MUTED} />} title="About">
            <View className="gap-1">
              <Text className="text-sm text-foreground">Sonar {APP_VERSION}</Text>
              <Text className="text-xs text-muted-foreground">
                Runs on the same Supabase project as Radar — one account, one profile, one friend list.
              </Text>
            </View>
          </SettingsSection>

          <Pressable
            onPress={signOut}
            className="flex-row items-center justify-center gap-2 rounded-full border border-border py-3 active:opacity-80"
          >
            <LogOut size={16} color={COLORS.foreground} />
            <Text className="font-medium text-foreground">Sign out</Text>
          </Pressable>
        </ScrollView>
      </ContentShell>

      {/* Pushed out of the tabs, so the navigator's own bar is gone — the screen
          mounts it itself and Profile stays lit while you are down here. */}
      <NavIslands />

      <ImportExportSheet ref={importExportRef} />
    </View>
  );
}
