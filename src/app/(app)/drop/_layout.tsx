import { colors } from '@/theme'
import { Stack } from 'expo-router'

export default function DropLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="story" options={{ presentation: 'transparentModal', gestureEnabled: false, animation: 'fade' }} />
    </Stack>
  )
}
