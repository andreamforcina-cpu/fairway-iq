import { router } from 'expo-router';
import { AppText, Button, Card, Screen, styles } from '../../components/ui';
export default function ProfileScreen() {
  return <Screen><AppText style={styles.eyebrow}>YOUR ACCOUNT</AppText><AppText accessibilityRole="header" style={styles.heading}>Profile</AppText><Card><AppText>You are not logged in.</AppText><AppText style={styles.muted}>Authentication not available yet. No personal account details are stored or shown.</AppText></Card><Button label="Create Account" onPress={() => router.push('/register')} /><Button label="Log In" onPress={() => router.push('/login')} /></Screen>;
}
