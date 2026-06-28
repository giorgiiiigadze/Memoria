import { colors, fontSize, fontWeight, radii, spacing } from '@/theme'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

type Props = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'outline'
  scheme?: 'dark' | 'light'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function AuthButton({
  label,
  onPress,
  variant = 'primary',
  scheme = 'dark',
  disabled = false,
  loading = false,
  icon,
  style,
}: Props) {
  const isInactive = disabled || loading
  const isLight = scheme === 'light'

  const primaryBg = isInactive && isLight
    ? colors.lightDisabled
    : isLight ? colors.charcoal : colors.white
  const primaryText = isLight ? colors.white : colors.ink
  const outlineBorder = isLight ? `${colors.charcoal}40` : colors.borderDefault
  const outlineText = isLight ? colors.charcoal : colors.textSecondary

  return (
    <TouchableOpacity
      style={[
        s.base,
        variant === 'primary'
          ? [s.primary, { backgroundColor: primaryBg }]
          : [s.outline, { borderColor: outlineBorder }],
        isInactive && !isLight && s.inactive,
        style,
      ]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.88}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? primaryText : outlineText} size="small" />
      ) : (
        <View style={s.inner}>
          {icon}
          <Text style={[s.label, { color: variant === 'primary' ? primaryText : outlineText }, isInactive && s.labelInactive]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  primary: {
    backgroundColor: colors.white,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  inactive: {
    opacity: 0.4,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.strong,
  },
  labelPrimary: {
    color: colors.ink,
  },
  labelOutline: {
    color: colors.textSecondary,
  },
  labelInactive: {
    color: colors.textTertiary,
  },
})
