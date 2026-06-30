import { GlassSurface } from '@/components/ui/GlassSurface'
import { glass } from '@/theme'
import type { ReactNode } from 'react'
import { StyleSheet, type ViewStyle } from 'react-native'

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
  return (
    <GlassSurface
      onPress={onPress}
      disabled={disabled}
      isInteractive
      colorScheme={colorScheme}
      style={[s.btn, style]}
      fallbackStyle={s.fallback}
    >
      {children}
    </GlassSurface>
  )
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
    backgroundColor: glass.fallback.floating,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: glass.fallback.floatingBorder,
  },
})
