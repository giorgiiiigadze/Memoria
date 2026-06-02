import { Image } from 'expo-image'
import { StyleSheet, Text, View, type ViewStyle } from 'react-native'

export function Avatar({ uri, name, size = 32, style }: { uri?: string | null; name?: string | null; size?: number; style?: ViewStyle }) {
  const initial = name?.charAt(0).toUpperCase() ?? '?'
  const radius = size / 2
  return (
    <View style={[s.base, { width: size, height: size, borderRadius: radius }, style]}>
      {uri ? (
        <Image source={{ uri }} style={s.image} contentFit="cover" />
      ) : (
        <Text style={[s.initial, { fontSize: Math.round(size * 0.44) }]}>{initial}</Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  base: {
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontWeight: '600',
    color: '#C4C4C4',
  },
})
