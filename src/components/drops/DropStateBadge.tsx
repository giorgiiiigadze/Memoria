import { STATE_META } from '@/constants/drops'
import type { DropState } from '@/types/database.types'
import { StyleSheet, Text, View } from 'react-native'

export function DropStateBadge({ state }: { state: DropState }) {
  const meta = STATE_META[state]
  return (
    <View style={[s.badge, { borderColor: meta.color }]}>
      <Text style={[s.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  badge: {
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
