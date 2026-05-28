import { useAuthStore } from '@/store/auth.store';
import { Redirect, Tabs } from 'expo-router';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) return <Redirect href="/(auth)/sign-in" />

  return (
    <Tabs screenOptions={{ headerShown: false, animation: 'none' }}>
      <Tabs.Screen name="(home)"     options={{ title: 'Home' }} />
      <Tabs.Screen name="(friends)"  options={{ title: 'Friends' }} />
      <Tabs.Screen name="(create)"   options={{ title: 'Create' }} />
      <Tabs.Screen name="(calendar)" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="(profile)"  options={{ title: 'Profile' }} />
      <Tabs.Screen name="drop"       options={{ href: null }} />
    </Tabs>
  );
}
