import { GlassContainer, GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'

const glassAvailable = isGlassEffectAPIAvailable()

type Props = {
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
  colorScheme?: 'light' | 'dark'
}

export function GlassIconButton({
  children,
  onPress,
  disabled,
  style,
  colorScheme = 'light',
}: Props) {
  if (glassAvailable) {
    const glassView = (
      <GlassView isInteractive colorScheme={colorScheme} style={[s.btn, style]}>
        {children}
      </GlassView>
    )
    return (
      <GlassContainer>
        {onPress ? (
          <Pressable onPress={onPress} disabled={disabled}>
            {glassView}
          </Pressable>
        ) : glassView}
      </GlassContainer>
    )
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [s.btn, s.fallback, style, pressed && s.pressed]}
      >
        {children}
      </Pressable>
    )
  }

  return <View style={[s.btn, s.fallback, style]}>{children}</View>
}

const s = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pressed: {
    opacity: 0.7,
  },
})
