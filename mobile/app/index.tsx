import { router } from 'expo-router';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Brand, Button, styles } from '../components/ui';
import { theme } from '../constants/theme';
import { useEntrance } from '../hooks/useEntrance';
import { ShotTrajectory } from '../components/ShotTrajectory';

export default function Welcome() {
  const entrance = useEntrance();
  const { height, width } = useWindowDimensions();
  const compact = height < 750 || width < 360;
  return <SafeAreaView style={[styles.safe, local.background]}><Animated.ScrollView style={entrance} contentContainerStyle={[local.content, compact ? local.compactContent : undefined]}>
    <Brand />
    <View style={[local.visual, compact ? local.compactVisual : undefined]}><ShotTrajectory /></View>
    <View style={{ gap: 16 }}><AppText style={styles.eyebrow}>YOUR GAME. WITH CLARITY.</AppText><AppText accessibilityRole="header" style={[local.title, compact ? local.compactTitle : undefined]}>Play smarter.{ '\n' }Golf <AppText style={[local.serif, compact ? local.compactSerif : undefined]}>better.</AppText></AppText><AppText style={styles.muted}>A clearer picture of your game. A more intentional next round.</AppText></View>
    <View style={{ gap: 12 }}><Button label="Create Account" onPress={() => router.push('/register')} /><Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={({ pressed }) => [local.loginButton, { opacity: pressed ? .8 : 1 }]}><AppText style={{ fontFamily: theme.fonts.bold }}>Log In</AppText></Pressable><Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)')} style={local.previewLink}><AppText style={[styles.muted, { textAlign: 'center', fontSize: 12 }]}>View sample preview</AppText></Pressable></View>
  </Animated.ScrollView></SafeAreaView>;
}
const local = StyleSheet.create({
  content: { flexGrow: 1, padding: 28, gap: 32, justifyContent: 'space-between', maxWidth: 650, width: '100%', alignSelf: 'center' },
  title: { fontSize: 48, lineHeight: 55, fontFamily: theme.fonts.bold, letterSpacing: -2 },
  serif: { fontFamily: theme.fonts.editorial, fontSize: 56, lineHeight: 60, color: theme.colors.accent },
  visual: { height: 200, width: '100%', alignItems: 'center', justifyContent: 'center' },
  loginButton: { minHeight: 52, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center' },
  previewLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  background: { backgroundColor: '#050505' },
  compactContent: { padding: 24, gap: 24 },
  compactVisual: { height: 170 },
  compactTitle: { fontSize: 42, lineHeight: 49 },
  compactSerif: { fontSize: 49, lineHeight: 54 },
});
