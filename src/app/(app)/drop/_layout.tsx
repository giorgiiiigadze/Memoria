import { colors } from '@/theme'
import { Slot } from 'expo-router'
import { View } from 'react-native'

export default function DropLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Slot />
    </View>
  )
}
