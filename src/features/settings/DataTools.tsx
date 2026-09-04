import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { ArrowUpDown, Clock, Database, Share2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { publicShelfUrl } from '@/lib/shelfLink';
import { COLORS } from '@/theme/colors';

const MUTED = COLORS.muted;

function ToolRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-4 py-4 active:opacity-80"
    >
      {icon}
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted-foreground">{subtitle}</Text>
      </View>
    </Pressable>
  );
}

/** The rows under Settings → Data: backups, shelf order, history, share link. */
export function DataTools({ onOpenImportExport }: { onOpenImportExport: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();

  const share = async () => {
    if (!user) return;
    await Clipboard.setStringAsync(publicShelfUrl(user.id));
    show('Public shelf link copied');
  };

  return (
    <View className="gap-2">
      <ToolRow
        icon={<Database size={20} color={MUTED} />}
        title="Import / export"
        subtitle="Back up or restore your collection, ratings and history as JSON"
        onPress={onOpenImportExport}
      />
      <ToolRow
        icon={<ArrowUpDown size={20} color={MUTED} />}
        title="Reorder shelf"
        subtitle="Set the order records appear in when sorting by shelf order"
        onPress={() => router.push('/reorder')}
      />
      <ToolRow
        icon={<Clock size={20} color={MUTED} />}
        title="Listening history"
        subtitle="Every spin you have logged, newest first"
        onPress={() => router.push('/history')}
      />
      <ToolRow
        icon={<Share2 size={20} color={MUTED} />}
        title="Share your shelf"
        subtitle="Copy a link anyone you allow can open"
        onPress={share}
      />
    </View>
  );
}
