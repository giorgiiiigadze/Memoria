import { colors, transparentHeaderOptions } from '@/theme'
import { Stack } from 'expo-router'
import { View } from 'react-native'

export default function HomeLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          ...transparentHeaderOptions,
          headerTitle: 'Memoria',
        }}
      />

      <Stack.Screen
        name="notifications"
        options={{
          ...transparentHeaderOptions,
          headerTitle: 'Notifications',
          headerBackTitle: 'Home',
        }}
      />
    </Stack>
    </View>
  )
}
