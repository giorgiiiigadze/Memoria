import { colors } from '@/theme'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { SymbolView } from 'expo-symbols'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

type Props = {
  onPress: () => void
  iconName: string
  iconColor?: string
  iconSize?: number
  iconWeight?: string
}

const glassAvailable = isGlassEffectAPIAvailable()

export function GlassIconButton({
  onPress,
  iconName,
  iconColor = colors.white,
  iconSize = 20,
  iconWeight,
}: Props) {
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
          <SymbolView
            name={iconName as any}
            size={iconSize}
            tintColor={iconColor}
            weight={iconWeight as any}
          />
        </GlassView>
      ) : (
        <View style={[styles.circle, styles.fallback]}>
          <SymbolView
            name={iconName as any}
            size={iconSize}
            tintColor={iconColor}
            weight={iconWeight as any}
          />
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  circle: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
  },
})
