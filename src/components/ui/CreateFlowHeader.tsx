import { colors } from '@/theme'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  variant?: 'back' | 'close'
  onPress?: () => void
}

export function CreateFlowHeader({ variant = 'back', onPress }: Props) {
  const insets = useSafeAreaInsets()
  const handlePress = onPress ?? (() => router.back())

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.buttonRow}>
        <TouchableOpacity onPress={handlePress} hitSlop={12} activeOpacity={0.7}>
          <SymbolView
            name={variant === 'close' ? 'xmark' : 'chevron.left'}
            size={22}
            tintColor={colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { paddingHorizontal: 16, backgroundColor: 'transparent' },
  buttonRow: {
    height: 56,
    justifyContent: 'center',
  },
})
