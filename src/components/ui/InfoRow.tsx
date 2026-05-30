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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#252525',
  },
  label: { fontSize: 14, color: '#626262' },
  value: { fontSize: 14, color: '#FFFFFF', fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 16 },
})
