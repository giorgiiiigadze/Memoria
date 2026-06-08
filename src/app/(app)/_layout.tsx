import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { Redirect, Stack } from 'expo-router'

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  useNotifications()

  if (!isAuthenticated) return <Redirect href="/(auth)/sign-in" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="drop" />
      <Stack.Screen name="create" options={{ presentation: 'modal' }} />
    </Stack>
  )
}