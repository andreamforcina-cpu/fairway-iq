import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../hooks/useSession';
import { theme } from '../constants/theme';

export function SessionNavigator({ reduced }: { reduced: boolean }) {
  const { loading, user, preview } = useSession();
  if (loading) return <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={theme.colors.accent} accessibilityLabel="Restoring session" /></View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' }, animation: reduced ? 'none' : 'fade' }}>
    <Stack.Protected guard={!user}>
      <Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="register" />
    </Stack.Protected>
    <Stack.Protected guard={!!user || preview}><Stack.Screen name="(tabs)" /></Stack.Protected>
  </Stack>;
}
