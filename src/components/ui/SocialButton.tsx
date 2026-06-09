import { colors, fontWeight, radii } from '@/theme'
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
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function SocialButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}: Props) {
  const isInactive = disabled || loading

  return (
    <TouchableOpacity
      style={[
        s.base,
        variant === 'primary' ? s.primary : s.outline,
        isInactive && s.inactive,
        style,
      ]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.88}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.ink : colors.textSecondary} size="small" />
      ) : (
        <View style={s.inner}>
          {icon}
          <Text style={[s.label, variant === 'primary' ? s.labelPrimary : s.labelOutline, isInactive && s.labelInactive]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  base: {
    borderRadius: radii.full,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 15,
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
