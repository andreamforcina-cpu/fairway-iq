import { router } from 'expo-router';
import { AppText, Button, Card, Screen, styles } from '../../components/ui';
import { useSession } from '../../hooks/useSession';
import { useState } from 'react';
export default function ProfileScreen() {
  const { user, logout } = useSession();
  const [busy, setBusy] = useState(false);
  return <Screen><AppText style={styles.eyebrow}>YOUR ACCOUNT</AppText><AppText accessibilityRole="header" style={styles.heading}>Profile</AppText>{user ? <><Card><AppText>{user.full_name}</AppText><AppText style={styles.muted}>{user.email}</AppText></Card><Button label={busy ? 'Signing out…' : 'Log Out'} onPress={() => { if (!busy) { setBusy(true); void logout().finally(() => setBusy(false)); } }} /></> : <><Card><AppText>You are viewing sample data.</AppText><AppText style={styles.muted}>Log in to access your personal profile.</AppText></Card><Button label="Create Account" onPress={() => router.push('/register')} /><Button label="Log In" onPress={() => router.push('/login')} /></>}</Screen>;
}
