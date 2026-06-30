import { GlassContainer, GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import type { ReactNode } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'

const glassAvailable = isGlassEffectAPIAvailable()

type Props = {
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  /** Style for the surface itself (size, radius, padding, layout). */
  style?: StyleProp<ViewStyle>
  /** Extra style applied only when the OS glass API is unavailable. */
  fallbackStyle?: StyleProp<ViewStyle>
  /** Tint blended into the glass. Omit for the system default (icon buttons). */
  tintColor?: string
  colorScheme?: 'light' | 'dark'
  glassEffectStyle?: 'regular' | 'clear'
  /** Whether the glass deforms under touch. Defaults to true when `onPress` is set. */
  isInteractive?: boolean
  /** Wrap in its own GlassContainer. Set false for surfaces nested in another container. */
  withContainer?: boolean
  pressedOpacity?: number
}

/**
 * The single source of truth for "liquid glass" surfaces. Owns the
 * availability check, the GlassContainer/GlassView wrapping, the press
 * handling, and the non-glass fallback so consumers don't re-implement them.
 */
export function GlassSurface({
  children,
  onPress,
  disabled,
  style,
  fallbackStyle,
  tintColor,
  colorScheme = 'dark',
  glassEffectStyle = 'regular',
  isInteractive,
  withContainer = true,
  pressedOpacity = 0.7,
}: Props) {
  const interactive = isInteractive ?? onPress != null

  if (glassAvailable) {
    const surface = (
      <GlassView
        isInteractive={interactive}
        colorScheme={colorScheme}
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
        style={style}
      >
        {children}
      </GlassView>
    )
    const pressable = onPress ? (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => (pressed ? { opacity: pressedOpacity } : null)}
      >
        {surface}
      </Pressable>
    ) : surface
    return withContainer ? <GlassContainer>{pressable}</GlassContainer> : pressable
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [style, fallbackStyle, pressed && { opacity: pressedOpacity }]}
      >
        {children}
      </Pressable>
    )
  }

  return <View style={[style, fallbackStyle]}>{children}</View>
}
