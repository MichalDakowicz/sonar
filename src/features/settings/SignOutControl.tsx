import { LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { signOut, type SignOutScope } from '@/features/auth/authActions';
import { SignOutScopePicker } from '@/features/auth/SignOutScopePicker';
import { COLORS } from '@/theme/colors';

/**
 * The sign-out button and the question it asks: just Sonar, or every Ping app.
 * Opens on "just Sonar" each time, so the reach-everywhere answer is always a
 * choice someone made, never one left over from last time.
 */
export function SignOutControl() {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<SignOutScope>('local');
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await signOut(scope);
      setOpen(false);
    } catch (error) {
      show(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => {
          setScope('local');
          setOpen(true);
        }}
        accessibilityLabel="Sign out"
        className="flex-row items-center justify-center gap-2 rounded-full border border-border py-3 active:opacity-80"
      >
        <LogOut size={16} color={COLORS.foreground} />
        <Text className="font-medium text-foreground">Sign out</Text>
      </Pressable>

      <ConfirmDialog
        visible={open}
        title="Sign out?"
        description="Your collection stays where it is — the same account signs back in."
        confirmLabel={scope === 'local' ? 'Sign out of Sonar' : 'Sign out everywhere'}
        destructive
        loading={busy}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      >
        <SignOutScopePicker value={scope} onChange={setScope} />
      </ConfirmDialog>
    </>
  );
}
