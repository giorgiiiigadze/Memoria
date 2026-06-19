import { colors } from '@/theme'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import type { SFSymbol } from 'sf-symbols-typescript'

type Props = {
  onPress: () => void
  iconName: SFSymbol
  androidIcon: React.ComponentType<{ size?: number; color?: string }>
  accessibilityLabel: string
  iconColor?: string
  iconSize?: number
  iconWeight?: SymbolViewProps['weight']
}

const glassAvailable = isGlassEffectAPIAvailable()

export function GlassIconButton({
  onPress,
  iconName,
  androidIcon: AndroidIcon,
  accessibilityLabel,
  iconColor = colors.white,
  iconSize = 20,
  iconWeight,
}: Props) {
  const icon = Platform.OS === 'ios' ? (
    <SymbolView name={iconName} size={iconSize} tintColor={iconColor} weight={iconWeight} />
  ) : (
    <AndroidIcon size={iconSize} color={iconColor} />
  )

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => pressed && styles.pressed}
    >
      {glassAvailable ? (
        <GlassView
          style={[styles.circle, styles.glassBg]}
          glassEffectStyle="regular"
          colorScheme="dark"
          tintColor="rgba(0,0,0,0.18)"
        >
          {icon}
        </GlassView>
      ) : (
        <View style={[styles.circle, styles.fallback]}>
          {icon}
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBg: {
    backgroundColor: 'rgba(30,30,30,0.55)',
  },
  fallback: {
    backgroundColor: colors.surfaceInput,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
  },
  pressed: {
    opacity: 0.7,
  },
})
