import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScrollViewProps, TextProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}
export function Screen({ children, keyboardShouldPersistTaps }: PropsWithChildren<{ keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'] }>) {
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}><ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} contentContainerStyle={styles.content}>{children}</ScrollView></SafeAreaView>;
}
export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Brand() {
  return <AppText style={styles.brand}>FAIRWAY <AppText style={{ color: theme.colors.accent }}>IQ</AppText></AppText>;
}
export function Button({ label, onPress, disabled = false, busy = false }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean }) {
  const unavailable = disabled || busy;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: unavailable, busy }} disabled={unavailable} onPress={onPress} style={({ pressed }) => [styles.button, { opacity: pressed || unavailable ? 0.8 : 1 }]}><AppText style={styles.buttonText}>{label}</AppText></Pressable>;
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 24, paddingBottom: 40, maxWidth: 700, width: '100%', alignSelf: 'center' },
  text: { color: theme.colors.text, fontFamily: theme.fonts.regular, fontSize: 16, lineHeight: 24 },
  brand: { fontFamily: theme.fonts.bold, fontSize: 19, letterSpacing: 2 },
  card: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius, padding: 24, gap: 12 },
  button: { minHeight: 52, backgroundColor: theme.colors.accent, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#000', fontFamily: theme.fonts.bold },
  muted: { color: theme.colors.muted, fontSize: 14 },
  heading: { fontSize: 32, lineHeight: 40, fontFamily: theme.fonts.bold, letterSpacing: -1 },
  eyebrow: { color: theme.colors.accent, fontSize: 11, letterSpacing: 1.5, fontFamily: theme.fonts.medium },
});
