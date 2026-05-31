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
    ? '#3B3B3B'
    : variant === 'primary'
      ? '#0A0A0A'
      : '#FFFFFF'

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
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#626262',
  },
  disabled: {
    backgroundColor: '#6E6E6E',
    borderWidth: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  labelPrimary: {
    color: '#0A0A0A',
  },
  labelSecondary: {
    color: '#FFFFFF',
  },
  labelDisabled: {
    color: '#3B3B3B',
  },
})