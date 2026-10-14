import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText } from './ui';
import { theme } from '../constants/theme';

/** Pass a profile only after real authentication; the current caller passes none. */
export function ProfileAvatar({ profile }: { profile?: { fullName: string; imageUrl?: string } }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = profile?.fullName.trim().split(/\s+/).map(word => Array.from(word)[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const imageUrl = profile?.imageUrl;
  const showImage = imageUrl?.startsWith('https://') && imageUrl !== failedUrl;
  return <Pressable accessibilityRole="button" accessibilityLabel="Open Profile" onPress={() => router.navigate('/(tabs)/profile')} style={({ pressed }) => [local.target, { opacity: pressed ? .7 : 1 }]}><View style={local.avatar}>{showImage ? <Image accessible={false} source={{ uri: imageUrl }} onError={() => setFailedUrl(imageUrl ?? null)} style={local.image} /> : initials ? <AppText style={local.initials}>{initials}</AppText> : <Ionicons name="person-outline" size={19} color={theme.colors.accent} />}</View></Pressable>;
}
const local = StyleSheet.create({
  target: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#B8F28B80', backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' }, initials: { fontFamily: theme.fonts.medium, color: theme.colors.accent, fontSize: 14 },
});
