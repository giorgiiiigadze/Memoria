import { colors, spacing } from '@/theme'
import { useEffect } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const AVATAR_SIZE = 34
const SIDE = 10

function DropCardSkeleton() {
  const { width } = useWindowDimensions()
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 750 }),
        withTiming(1, { duration: 750 }),
      ),
      -1,
      false,
    )
  }, [])

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View style={[s.post, pulse]}>
      <View style={s.header}>
        <View style={s.avatar} />
        <View style={s.headerText}>
          <View style={s.linePrimary} />
          <View style={s.lineSecondary} />
        </View>
      </View>
      <View style={[s.photo, { width }]} />
    </Animated.View>
  )
}

export function DropCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={s.cardWrapper}>
          <DropCardSkeleton />
        </View>
      ))}
    </>
  )
}

const s = StyleSheet.create({
  post: {
    marginBottom: spacing[8],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: SIDE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surfaceRaised,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  linePrimary: {
    height: 13,
    width: '45%',
    borderRadius: 6,
    backgroundColor: colors.surfaceRaised,
  },
  lineSecondary: {
    height: 11,
    width: '30%',
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  photo: {
    aspectRatio: 3 / 4,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
  },
  cardWrapper: {
    marginBottom: spacing[2],
  },
})
