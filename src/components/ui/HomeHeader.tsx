import { colors } from '@/theme'
import { Stack, router } from 'expo-router'
import { View } from 'react-native'

export default function HomeHeader() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Memoria',
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerBackground: () => <View style={{ flex: 1, backgroundColor: 'transparent' }} />,
          headerTitleStyle: { color: colors.white, fontWeight: '700', fontSize: 18 },
          headerShadowVisible: false,
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="person.badge.plus"
          onPress={() => router.push('/(app)/(tabs)/(friends)' as any)}
        />
        <Stack.Toolbar.Button
          icon="bell.fill"
          onPress={() => router.push('/(app)/(tabs)/(home)/notifications' as any)}
        />
      </Stack.Toolbar>
    </>
  )
}
