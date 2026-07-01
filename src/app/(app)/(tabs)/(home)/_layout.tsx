import { colors, fontWeight, transparentHeaderOptions } from '@/theme'
import { Stack } from 'expo-router'
import { View } from 'react-native'

export default function HomeLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'none',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          ...transparentHeaderOptions,
          headerTitle: 'Memoria',
          headerTitleStyle: {
            ...transparentHeaderOptions.headerTitleStyle,
            fontSize: 22,
            fontWeight: fontWeight.bold,
          },
        }}
      />

      <Stack.Screen
        name="notifications"
        options={{
          ...transparentHeaderOptions,
          headerTitle: 'Notifications',
          headerBackTitle: 'Home',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
    </View>
  )
}
