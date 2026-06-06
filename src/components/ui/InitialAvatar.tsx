import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'

import { avatarColors, colors } from '@/theme/colors'
import { fontWeight } from '@/theme'

function pickColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

interface Props {
  name: string
  avatarUrl?: string | null
  size: number
}

export function InitialAvatar({ name, avatarUrl, size }: Props) {
  const radius = size / 2
  const fs = Math.round(size * 0.42)

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
      <Text style={[s.initial, { fontSize: fs }]}>{initial}</Text>
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
    fontWeight: fontWeight.semiBold,
    color: colors.white,
  },
})
