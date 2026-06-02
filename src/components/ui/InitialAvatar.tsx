import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'

const COLORS = [
  '#E74C3C',
  '#E67E22',
  '#27AE60',
  '#2ECC71',
  '#1ABC9C',
  '#2980B9',
  '#8E44AD',
  '#D81B60',
  '#0097A7',
  '#FF5722',
]

function pickColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface Props {
  name: string
  avatarUrl?: string | null
  size: number
}

export function InitialAvatar({ name, avatarUrl, size }: Props) {
  const radius = size / 2
  const fontSize = Math.round(size * 0.38)

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
      />
    )
  }

  const initial = (name || '?').charAt(0).toUpperCase()
  const bgColor = pickColor(name)

  return (
    <View style={[s.circle, { width: size, height: size, borderRadius: radius, backgroundColor: bgColor }]}>
      <Text style={[s.initial, { fontSize }]}>{initial}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
