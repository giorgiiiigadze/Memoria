import { colors, fontWeight, radii, spacing } from '@/theme'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export function Chip({
  label, variant, onPress, disabled, style,
}: {
  label: string
  variant: 'blue' | 'green' | 'muted' | 'white' | 'card'
  onPress?: () => void
  disabled?: boolean
  style?: object
}) {
  const chipStyle = [
    s.chip,
    variant === 'blue' && s.chipBlue,
    variant === 'green' && s.chipGreen,
    variant === 'muted' && s.chipMuted,
    variant === 'white' && s.chipWhite,
    variant === 'card' && s.chipCard,
    style,
  ]
  const labelStyle = [
    s.chipLabel,
    variant === 'blue' && s.chipLabelWhite,
    variant === 'green' && s.chipLabelGreen,
    variant === 'muted' && s.chipLabelMuted,
    variant === 'white' && s.chipLabelDark,
    variant === 'card' && s.chipLabelWhite,
  ]

  if (!onPress) return <View style={chipStyle}><Text style={labelStyle}>{label}</Text></View>

  return (
    <TouchableOpacity style={chipStyle} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <Text style={labelStyle}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  chip: { paddingHorizontal: spacing[4], paddingVertical: 8, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
  chipBlue: { backgroundColor: colors.primary },
  chipGreen: { borderWidth: 0.5, borderColor: colors.success },
  chipMuted: { borderWidth: 0.5, borderColor: colors.borderDefault },
  chipWhite: { backgroundColor: colors.white },
  chipCard: { backgroundColor: colors.surfaceCard },
  chipLabel: { fontSize: 13, fontWeight: fontWeight.semiBold },
  chipLabelWhite: { color: colors.white },
  chipLabelGreen: { color: colors.success },
  chipLabelMuted: { color: colors.textTertiary },
  chipLabelDark: { color: colors.ink },
})
