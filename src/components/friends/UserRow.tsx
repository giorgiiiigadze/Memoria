import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import type { Profile } from '@/types/database.types'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

export function UserRow({ profile, right }: { profile: Profile; right?: ReactNode }) {
  const name = profile.display_name ?? profile.username
  return (
    <View style={s.row}>
      <View style={s.avatarWrap}>
        <InitialAvatar name={name} avatarUrl={profile.avatar_url} size={54} />
      </View>
      <View style={s.rowInfo}>
        <Text style={s.rowName}>{profile.display_name ?? profile.username}</Text>
        <Text style={s.rowHandle}>@{profile.username}</Text>
      </View>
      {right && <View style={s.rowRight}>{right}</View>}
    </View>
  )
}

export function UserRowSkeleton() {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    )
  }, [])

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View style={[s.row, pulse]}>
      <View style={[s.avatarWrap, s.skeletonAvatar]} />
      <View style={s.rowInfo}>
        <View style={s.skeletonName} />
        <View style={s.skeletonHandle} />
      </View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  avatarWrap: { marginRight: spacing[3] },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: fontWeight.regular, color: colors.white },
  rowHandle: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 1 },
  rowRight: { marginLeft: spacing[3] },
  skeletonAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surfaceRaised,
  },
  skeletonName: {
    height: 13,
    width: 120,
    borderRadius: 6,
    backgroundColor: colors.surfaceRaised,
    marginBottom: 7,
  },
  skeletonHandle: {
    height: 11,
    width: 80,
    borderRadius: 5,
    backgroundColor: colors.surfaceRaised,
  },
})
