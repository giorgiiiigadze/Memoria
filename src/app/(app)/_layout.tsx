import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/auth.store'
import { transparentHeaderOptions } from '@/theme'
import { Redirect, Stack } from 'expo-router'

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  useNotifications()

  if (!isAuthenticated) return <Redirect href="/(auth)" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="drop"
        options={{
          ...transparentHeaderOptions,
          headerBackTitle: 'Home',
        }}
      />
      <Stack.Screen
        name="create"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  )
}