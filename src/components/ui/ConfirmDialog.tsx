import { Modal, Pressable, Text, View } from 'react-native';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Shared confirm modal (e.g. "Remove from library") - a plain RN Modal since
// it needs to work on Android/iOS/Web without a bottom-sheet drag gesture.
export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm gap-4 rounded-2xl border border-border bg-card p-5">
          <Text className="text-lg font-bold text-card-foreground">{title}</Text>
          {!!description && <Text className="text-sm text-muted-foreground">{description}</Text>}
          <View className="flex-row justify-end gap-3 pt-1">
            <Pressable onPress={onCancel} className="rounded-full px-4 py-2">
              <Text className="font-medium text-foreground">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: destructive ? '#ef4444' : 'hsl(160 84% 39%)', opacity: loading ? 0.6 : 1 }}
            >
              <Text className="font-semibold text-white">{loading ? 'Please wait…' : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
