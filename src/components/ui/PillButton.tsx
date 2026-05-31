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
  active?: boolean
  disabled?: boolean
  loading?: boolean
  variant?: Variant
  style?: StyleProp<ViewStyle>
}

export function PillButton({
  label,
  onPress,
  active = false,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}: Props) {
  const isDisabled = disabled || loading
  const isActive = active && !isDisabled

  const btnStyle = [
    styles.base,
    variant === 'secondary' ? styles.secondary : styles.primary,
    isActive && (variant === 'secondary' ? styles.secondaryActive : styles.primaryActive),
    isDisabled && styles.disabled,
    style,
  ]

  const labelStyle = [
    styles.label,
    variant === 'secondary' ? styles.labelSecondary : styles.labelPrimary,
    isActive && (variant === 'secondary' ? styles.labelSecondaryActive : styles.labelPrimaryActive),
    isDisabled && styles.labelDisabled,
  ]

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={isDisabled} activeOpacity={0.85}>
      {loading
        ? <ActivityIndicator color="#555555" size="small" />
        : <Text style={labelStyle}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#2C2C2C',
  },
  primaryActive: {
    backgroundColor: '#FFFFFF',
  },
  secondary: {
    borderWidth: 1.5,
    borderColor: '#2C2C2C',
  },
  secondaryActive: {
    borderColor: '#FFFFFF',
  },
  disabled: {
    opacity: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  labelPrimary: {
    color: '#7A7A7A',
  },
  labelPrimaryActive: {
    color: '#000000',
  },
  labelSecondary: {
    color: '#3B3B3B',
  },
  labelSecondaryActive: {
    color: '#FFFFFF',
  },
  labelDisabled: {},
})
