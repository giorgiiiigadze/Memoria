import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { StyleSheet, Text, View } from 'react-native'

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value} numberOfLines={2}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderSubtle,
  },
  label: { fontSize: fontSize.sm, color: colors.textTertiary },
  value: { fontSize: fontSize.sm, color: colors.white, fontWeight: fontWeight.medium, flexShrink: 1, textAlign: 'right', marginLeft: spacing[4] },
})
