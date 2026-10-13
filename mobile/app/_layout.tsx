import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { AppText } from '../components/ui';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function RootLayout() {
  const reduced = useReducedMotion();
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, InstrumentSerif_400Regular_Italic });
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={theme.colors.accent} accessibilityLabel="Loading FAIRWAY IQ" /></View>;
  if (error) return <View style={{ flex: 1, backgroundColor: '#000', padding: 32, justifyContent: 'center' }}><AppText>Unable to load fonts. Please restart the app.</AppText></View>;
  return <SafeAreaProvider><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' }, animation: reduced ? 'none' : 'fade' }} /></SafeAreaProvider>;
}
