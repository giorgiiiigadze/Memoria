import { colors } from '@/theme'
import { Stack } from 'expo-router'

export default function FriendsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="contacts" />
      <Stack.Screen name="invite" options={{ animation: 'slide_from_bottom', animationDuration: 250 }} />
    </Stack>
  )
}
