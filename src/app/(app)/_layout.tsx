import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { colors } from '@/theme'
import { Redirect, Stack } from 'expo-router'

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  useNotifications()

  if (!isAuthenticated) return <Redirect href="/(auth)" />

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="drop" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ presentation: 'modal' }} />
    </Stack>
  )
}
