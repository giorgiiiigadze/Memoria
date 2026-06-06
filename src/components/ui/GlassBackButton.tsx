import { colors } from '@/theme'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

const glassAvailable = isGlassEffectAPIAvailable()

type Props = {
  onPress: () => void
  iconColor?: string
}

export function GlassBackButton({ onPress, iconColor = colors.white }: Props) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={12} activeOpacity={0.8}>
      {glassAvailable ? (
        <GlassView
          style={styles.circle}
          glassEffectStyle="regular"
          colorScheme="dark"
          tintColor="rgba(0,0,0,0.18)"
          isInteractive
        >
          <SymbolView name="chevron.left" size={18} tintColor={iconColor} />
        </GlassView>
      ) : (
        <View style={[styles.circle, styles.fallback]}>
          <SymbolView name="chevron.left" size={18} tintColor={iconColor} />
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
  },
})
