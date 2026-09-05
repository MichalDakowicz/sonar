import { Redirect, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import GoogleIcon from '@/assets/brand/google.svg';
import Logo from '@/assets/brand/logo.svg';
import { useToast } from '@/components/ui/Toast';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/features/auth/authActions';
import { useAuth } from '@/features/auth/AuthProvider';
import { MAX_W, useIsDesktop } from '@/hooks/useResponsive';
import { COLORS } from '@/theme/colors';

export default function Login() {
  const { user } = useAuth();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [busy, setBusy] = useState(false);
  const isDesktop = useIsDesktop();

  // `as Href`: expo-router's generated route union is unstable for the
  // transparent (tabs) group across typegen runs — "/" always resolves
  // correctly at runtime regardless.
  if (user) return <Redirect href={'/' as Href} />;

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      show(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = () => {
    if (!email || !password) return show('Enter an email and password');
    runAction(() => (mode === 'signIn' ? signInWithEmail(email, password) : signUpWithEmail(email, password)));
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center gap-10 px-6 py-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center gap-2">
            <View className="h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Logo width={48} height={48} />
            </View>
            <Text className="text-4xl font-bold tracking-tight text-foreground">Sonar</Text>
            <Text className="text-center text-muted-foreground">Curate your physical &amp; digital collection.</Text>
            {/* Worth saying up front: the account is the Radar account, and
                someone who has one should not create a second. */}
            <Text className="pt-1 text-center text-xs text-muted-foreground/70">
              Same account as Radar — sign in with it and your profile and friends come with you.
            </Text>
          </View>

          {/* Capped and boxed so a wide browser shows a sign-in card rather than
              inputs stretched across the monitor. */}
          <View
            className={isDesktop ? 'w-full gap-3 rounded-2xl border border-border bg-card p-8' : 'w-full gap-3'}
            style={{ maxWidth: MAX_W.form }}
          >
            <Pressable
              onPress={() => runAction(signInWithGoogle)}
              disabled={busy}
              className="flex-row items-center justify-center gap-2 rounded-full bg-foreground py-3 active:opacity-80"
              style={{ opacity: busy ? 0.5 : 1 }}
            >
              <GoogleIcon width={18} height={18} />
              <Text className="font-medium text-background">Sign in with Google</Text>
            </Pressable>

            <View className="my-1 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Text className="text-xs text-muted-foreground">OR</Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              className="rounded-full border border-border px-5 py-3 text-foreground"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              className="rounded-full border border-border px-5 py-3 text-foreground"
            />

            <Pressable
              onPress={handleEmail}
              disabled={busy}
              className="flex-row items-center justify-center gap-2 rounded-full border border-border py-3 active:opacity-80"
              style={{ opacity: busy ? 0.5 : 1 }}
            >
              {busy ? (
                <ActivityIndicator color={COLORS.accent} />
              ) : (
                <Text className="font-medium text-foreground">
                  {mode === 'signIn' ? 'Sign in with email' : 'Create account'}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} className="items-center py-1">
              <Text className="text-sm text-muted-foreground">
                {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
