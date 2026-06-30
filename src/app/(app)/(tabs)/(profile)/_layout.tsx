import { colors } from '@/theme'
import { Stack } from 'expo-router'
import { View } from 'react-native'

export default function ProfileLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="settings"
          options={{ presentation: 'modal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: colors.surfaceGrouped }, headerShown: true }}
        />
      </Stack>
    </View>
  )
}
