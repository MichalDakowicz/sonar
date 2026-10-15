import { useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';

import type { QrCopy } from '@/features/auth/qr/qrCopy';
import { readSignInCode } from '@/lib/signInCode';

export function SignInCodeInput({ copy, onSubmit }: { copy: QrCopy; onSubmit: (code: string) => void }) {
  const [value, setValue] = useState('');
  const code = readSignInCode(value);
  const submit = () => {
    if (!code) return;
    Keyboard.dismiss();
    onSubmit(code);
  };
  return (
    <View className="gap-3">
      <Text className="text-sm font-medium text-foreground">{copy.enterCode}</Text>
      <TextInput
        accessibilityLabel={copy.signInCode}
        value={value}
        onChangeText={setValue}
        placeholder="ABCD-EFGH-JKLM-NPQR"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={64}
        returnKeyType="go"
        onSubmitEditing={submit}
        className="rounded-xl border border-border bg-card px-4 py-3 text-lg text-foreground"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !code }}
        disabled={!code}
        onPress={submit}
        className="items-center rounded-full bg-primary px-5 py-3 active:opacity-80"
        style={{ opacity: code ? 1 : 0.5 }}
      >
        <Text className="font-medium text-primary-foreground">{copy.useCode}</Text>
      </Pressable>
    </View>
  );
}
