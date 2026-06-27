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
      />
    </View>
  )
}
