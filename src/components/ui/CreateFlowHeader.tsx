import { colors } from '@/theme'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

type Props = {
  variant?: 'back' | 'close'
  onPress?: () => void
}

export function CreateFlowHeader({ variant = 'back', onPress }: Props) {
  const handlePress = onPress ?? (() => router.back())

  return (
    <View style={s.root}>
      <TouchableOpacity onPress={handlePress} hitSlop={12} activeOpacity={0.7}>
        <SymbolView
          name={variant === 'close' ? 'xmark' : 'chevron.left'}
          size={22}
          tintColor={colors.white}
        />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
})
