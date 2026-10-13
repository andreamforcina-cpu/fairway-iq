import { router } from 'expo-router';
import { AppText, Button, Card, Screen, styles } from './ui';
export function UpcomingScreen({ title, description }: { title: string; description: string }) {
  return <Screen><AppText style={styles.eyebrow}>PLANNED FOR A FUTURE SPRINT</AppText><AppText accessibilityRole="header" style={styles.heading}>{title}</AppText><Card><AppText>{description}</AppText><AppText style={styles.muted}>This is a navigation preview. This feature is not available yet.</AppText></Card><Button label="Back to dashboard" onPress={() => router.navigate('/(tabs)')} /></Screen>;
}
