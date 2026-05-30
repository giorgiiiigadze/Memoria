import { StyleSheet, View } from 'react-native'

export function Dots({ active, count = 4 }: { active: number; count?: number }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[s.dot, i === active && s.dotActive]} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B3B3B' },
  dotActive: { backgroundColor: '#0044FF', width: 18 },
})
