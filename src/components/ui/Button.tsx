import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

type Variant = 'primary' | 'secondary'

type Props = {
  label: string
  onPress: () => void
  variant?: Variant
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: Props) {
  const isInactive = disabled || loading

  const faceStyle = [
    styles.base,
    variant === 'primary' ? styles.primary : styles.secondary,
    isInactive && styles.disabled,
    style,
  ]

  const labelStyle = [
    styles.label,
    variant === 'primary' ? styles.labelPrimary : styles.labelSecondary,
    isInactive && styles.labelDisabled,
  ]

  const spinnerColor = isInactive
    ? colors.borderDefault
    : variant === 'primary'
      ? colors.ink
      : colors.white

  return (
    <TouchableOpacity
      style={faceStyle}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color={spinnerColor} size="small" />
        : <Text style={labelStyle}>{label}</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.white,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textTertiary,
  },
  disabled: {
    backgroundColor: '#565658',
    borderWidth: 0,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.strong,
    letterSpacing: 0.1,
  },
  labelPrimary: {
    color: colors.ink,
  },
  labelSecondary: {
    color: colors.white,
  },
  labelDisabled: {
    color: colors.textTertiary,
  },
})
