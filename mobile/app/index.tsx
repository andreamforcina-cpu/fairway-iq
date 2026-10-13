import { router } from 'expo-router';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Brand, Button, styles } from '../components/ui';
import { theme } from '../constants/theme';
import { useEntrance } from '../hooks/useEntrance';

export default function Welcome() {
  const entrance = useEntrance();
  return <SafeAreaView style={styles.safe}><Animated.ScrollView style={entrance} contentContainerStyle={local.content}>
    <Brand />
    <View accessible accessibilityLabel="FAIRWAY IQ golf intelligence" style={local.visual}><View style={local.orbit} /><View style={[local.orbit, { width: 180, height: 64 }]} /><View style={local.ball} /></View>
    <View style={{ gap: 16 }}><AppText style={styles.eyebrow}>YOUR GAME. WITH CLARITY.</AppText><AppText accessibilityRole="header" style={local.title}>Play smarter.{ '\n' }Golf <AppText style={local.serif}>better.</AppText></AppText><AppText style={styles.muted}>A clearer picture of your game. A more intentional next round.</AppText></View>
    <View style={{ gap: 12 }}><Button label="Get Started  ↗" onPress={() => router.replace('/(tabs)')} /><AppText style={[styles.muted, { textAlign: 'center', fontSize: 12 }]}>Explore a preview with sample data. No account required.</AppText></View>
  </Animated.ScrollView></SafeAreaView>;
}
const local = StyleSheet.create({
  content: { flexGrow: 1, padding: 28, gap: 32, justifyContent: 'space-between', maxWidth: 650, width: '100%', alignSelf: 'center' },
  title: { fontSize: 48, lineHeight: 55, fontFamily: theme.fonts.medium, letterSpacing: -2 },
  serif: { fontFamily: theme.fonts.editorial, fontSize: 56, lineHeight: 60, color: theme.colors.accent },
  visual: { height: 200, alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', width: 270, height: 100, borderWidth: 1, borderColor: '#B8F28B55', borderRadius: 150, transform: [{ rotate: '-20deg' }] },
  ball: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f4f7ed', borderWidth: 5, borderColor: '#d7e1cb' },
});
