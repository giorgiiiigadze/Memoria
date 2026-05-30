import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export function Chip({
  label, variant, onPress, disabled, style,
}: {
  label: string
  variant: 'blue' | 'green' | 'muted'
  onPress?: () => void
  disabled?: boolean
  style?: object
}) {
  const chipStyle = [
    s.chip,
    variant === 'blue' && s.chipBlue,
    variant === 'green' && s.chipGreen,
    variant === 'muted' && s.chipMuted,
    style,
  ]
  const labelStyle = [
    s.chipLabel,
    variant === 'blue' && s.chipLabelWhite,
    variant === 'green' && s.chipLabelGreen,
    variant === 'muted' && s.chipLabelMuted,
  ]

  if (!onPress) return <View style={chipStyle}><Text style={labelStyle}>{label}</Text></View>

  return (
    <TouchableOpacity style={chipStyle} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <Text style={labelStyle}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  chipBlue: { backgroundColor: '#0044FF' },
  chipGreen: { borderWidth: 0.5, borderColor: '#4CAF7D' },
  chipMuted: { borderWidth: 0.5, borderColor: '#3B3B3B' },
  chipLabel: { fontSize: 13, fontWeight: '500' },
  chipLabelWhite: { color: '#FFFFFF' },
  chipLabelGreen: { color: '#4CAF7D' },
  chipLabelMuted: { color: '#626262' },
})
