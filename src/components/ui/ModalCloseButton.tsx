import { colors } from '@/theme'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { Pressable, StyleSheet } from 'react-native'

export function ModalCloseButton() {
  return (
    <Pressable
      onPress={() => router.canDismiss() ? router.dismiss() : router.back()}
      hitSlop={12}
      style={({ pressed }) => pressed && s.pressed}
    >
      <SymbolView name="xmark" size={20} tintColor={colors.white} weight="semibold" />
    </Pressable>
  )
}

const s = StyleSheet.create({
  pressed: { opacity: 0.6 },
})
