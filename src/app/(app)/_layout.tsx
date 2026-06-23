import { DropHeaderMenu } from '@/components/drops/DropHeaderMenu'
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
        options={({ route }) => ({
          ...transparentHeaderOptions,
          headerTitle: '',
          headerBackTitle: (route.params as any)?.backTitle ?? 'Home',
          headerRight: () => <DropHeaderMenu id={(route.params as any)?.id ?? ''} />,
        })}
      />
      <Stack.Screen
        name="create"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  )
}
