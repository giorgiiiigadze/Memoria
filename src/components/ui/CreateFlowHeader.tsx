import { GlassBackButton } from '@/components/ui/GlassBackButton'
import { GlassCloseButton } from '@/components/ui/GlassCloseButton'
import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'
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
        {variant === 'close'
          ? <GlassCloseButton onPress={handlePress} />
          : <GlassBackButton onPress={handlePress} />}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { paddingHorizontal: 10, backgroundColor: 'transparent' },
  buttonRow: {
    height: 56,
    justifyContent: 'center',
  },
})
