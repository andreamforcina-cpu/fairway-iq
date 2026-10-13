import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { theme } from '../../constants/theme';
const tabs = [
  { name: 'index', title: 'Home', icon: 'home-outline' },
  { name: 'rounds', title: 'Rounds', icon: 'flag-outline' },
  { name: 'analytics', title: 'Analytics', icon: 'stats-chart-outline' },
  { name: 'coach', title: 'AI Coach', icon: 'sparkles-outline' },
  { name: 'profile', title: 'Profile', icon: 'person-outline' },
] as const;
export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.accent, tabBarInactiveTintColor: theme.colors.muted, tabBarStyle: { backgroundColor: '#0b0b0b', borderTopColor: theme.colors.border }, tabBarLabelStyle: { fontFamily: theme.fonts.medium, fontSize: 10 } }}>{tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} color={color} size={size} /> }} />)}</Tabs>;
}
