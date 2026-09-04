import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { ImageIcon, Trash2, Upload } from 'lucide-react-native';
import { forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { BottomSheetTextInput, Sheet, SheetScrollView, type BottomSheetModal } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

const MUTED = 'hsl(0 0% 63.9%)';

// The avatar is stored inline as a data URI in profiles.pfp — the same column
// Radar writes, so changing your picture here changes it there. No storage
// bucket: a 256px JPEG is a few kilobytes of base64, and a bucket would be a
// second thing to configure on the free plan.
//
// No requestMediaLibraryPermissionsAsync() first: launchImageLibraryAsync is the Android
// photo picker, which hands back the one chosen image without any read permission. Asking
// would reintroduce READ_MEDIA_IMAGES, which Play's photo and video permissions policy
// only grants an app that genuinely browses the library.
async function pickAndProcess(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;

  const manipulated = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 256 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!manipulated.base64) return null;
  return `data:image/jpeg;base64,${manipulated.base64}`;
}

export const EditProfileSheet = forwardRef<BottomSheetModal>(function EditProfileSheet(_props, ref) {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const { show } = useToast();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pfp, setPfp] = useState('');
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');

  // Seed the form from the loaded profile (and re-seed if it changes).
  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setDisplayName(profile.displayName ?? '');
      setPfp(profile.pfp ?? '');
    }
  }, [profile]);

  const pickImage = async () => {
    setError('');
    setPicking(true);
    try {
      const dataUri = await pickAndProcess();
      if (dataUri) setPfp(dataUri);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process the image.');
    } finally {
      setPicking(false);
    }
  };

  const save = async () => {
    setError('');
    try {
      await updateProfile.mutateAsync({ username, displayName, pfp });
      show('Profile updated');
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
    }
  };

  return (
    <Sheet ref={ref} snapPoints={['70%', '90%']}>
      <SheetScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 32 }}>
        <Text className="text-lg font-bold text-foreground">Edit profile</Text>

        {!!error && (
          <View className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
            <Text className="text-sm text-red-400">{error}</Text>
          </View>
        )}

        {/* Avatar */}
        <View className="flex-row items-center gap-4">
          {pfp ? (
            <Image source={{ uri: pfp }} style={{ width: 80, height: 80, borderRadius: 40 }} contentFit="cover" />
          ) : (
            <View className="h-20 w-20 items-center justify-center rounded-full border border-border bg-secondary">
              <ImageIcon size={28} color={MUTED} />
            </View>
          )}
          <View className="flex-1 gap-2">
            <Pressable
              onPress={pickImage}
              disabled={picking}
              className="flex-row items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-2.5"
            >
              {picking ? <ActivityIndicator size="small" color={MUTED} /> : <Upload size={16} color="hsl(0 0% 98%)" />}
              <Text className="text-sm font-medium text-foreground">{picking ? 'Processing…' : 'Upload image'}</Text>
            </Pressable>
            {!!pfp && (
              <Pressable onPress={() => setPfp('')} className="flex-row items-center justify-center gap-2 py-1">
                <Trash2 size={14} color="#f87171" />
                <Text className="text-xs text-red-400">Remove photo</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Display name */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">Display name</Text>
          <BottomSheetTextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={MUTED}
            style={{ color: 'white' }}
            className="rounded-lg border border-border bg-secondary px-3 py-3 text-foreground"
          />
        </View>

        {/* Username */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">Username</Text>
          <BottomSheetTextInput
            value={username}
            onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            autoCapitalize="none"
            placeholder="uniquename"
            placeholderTextColor={MUTED}
            style={{ color: 'white' }}
            className="rounded-lg border border-border bg-secondary px-3 py-3 text-foreground"
          />
          <Text className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores.</Text>
        </View>

        <Pressable
          onPress={save}
          disabled={updateProfile.isPending || !username.trim()}
          className="mt-2 items-center rounded-full bg-primary py-3"
          style={{ opacity: updateProfile.isPending || !username.trim() ? 0.6 : 1 }}
        >
          <Text className="font-semibold text-primary-foreground">
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </Text>
        </Pressable>
      </SheetScrollView>
    </Sheet>
  );
});
