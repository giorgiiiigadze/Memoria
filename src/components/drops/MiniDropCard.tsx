import type { DropWithParticipants } from '@/api/drops.api'
import type { PhotoWithUploader } from '@/api/photos.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontWeight } from '@/theme'
import type { DropState } from '@/types/database.types'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

const COLS = 3
const GAP = 4
const H_PAD = 40

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtShort(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

const STATE_COLOR: Record<DropState, string> = {
  active: colors.primary,
  ready: colors.success,
  open: colors.warning,
  expired: colors.textTertiary,
}

function MiniDropCard({ drop }: { drop: DropWithParticipants }) {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - H_PAD - GAP * (COLS - 1)) / COLS)
  const cardHeight = Math.floor(cardWidth * (4 / 3))

  return (
    <TouchableOpacity
      style={{ width: cardWidth }}
      onPress={() => router.push({ pathname: '/drop/[id]', params: { id: drop.id } } as any)}
      activeOpacity={0.82}
    >
      <View style={[s.thumb, { width: cardWidth, height: cardHeight }]}>
        {drop.thumbnail_url ? (
          <Image
            source={{ uri: drop.thumbnail_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, s.placeholder]} />
        )}

        <View style={[s.stateDot, { backgroundColor: STATE_COLOR[drop.state] }]} />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={s.gradient}
          pointerEvents="none"
        >
          <Text style={s.title} numberOfLines={1}>{drop.title}</Text>
        </LinearGradient>
      </View>

      <Text style={s.date}>{fmtShort(drop.open_date)}</Text>
    </TouchableOpacity>
  )
}

type MiniPhotoCardProps = {
  photo: PhotoWithUploader
  size: number
  onPress: () => void
}

export function MiniPhotoCard({ photo, size, onPress }: MiniPhotoCardProps) {
  const cardHeight = Math.floor(size * (4 / 3))
  const name = photo.uploader?.display_name ?? photo.uploader?.username ?? ''

  return (
    <TouchableOpacity style={{ width: size }} onPress={onPress} activeOpacity={0.82}>
      <View style={[s.thumb, { width: size, height: cardHeight }]}>
        <Image
          source={{ uri: photo.cdn_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={photo.id}
          transition={150}
        />
      </View>
      <View style={s.photoMeta}>
        <InitialAvatar name={name || '?'} avatarUrl={photo.uploader?.avatar_url ?? null} size={16} />
        {name ? <Text style={s.photoName} numberOfLines={1}>{name}</Text> : null}
      </View>
    </TouchableOpacity>
  )
}

export function MiniDropGrid({ drops }: { drops: DropWithParticipants[] }) {
  return (
    <View style={s.grid}>
      {drops.map(drop => (
        <MiniDropCard key={drop.id} drop={drop} />
      ))}
    </View>
  )
}

function MiniDropCardSkeleton() {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - H_PAD - GAP * (COLS - 1)) / COLS)
  const cardHeight = Math.floor(cardWidth * (4 / 3))
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
    <Animated.View style={[{ width: cardWidth }, pulse]}>
      <View style={[s.thumb, s.skeletonThumb, { width: cardWidth, height: cardHeight }]} />
      <View style={s.skeletonDate} />
    </Animated.View>
  )
}

export function MiniDropGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={s.grid}>
      {Array.from({ length: count }, (_, i) => (
        <MiniDropCardSkeleton key={i} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  thumb: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceDeep,
  },
  placeholder: {
    backgroundColor: colors.surfaceRaised,
  },
  stateDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingTop: 24,
    paddingBottom: 7,
  },
  title: {
    fontSize: 10,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
  },
  date: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 4,
    marginLeft: 2,
  },
  skeletonThumb: {
    backgroundColor: colors.surfaceRaised,
  },
  photoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    marginLeft: 2,
  },
  photoName: {
    fontSize: 10,
    color: colors.textSecondary,
    flex: 1,
  },
  skeletonDate: {
    height: 10,
    width: 32,
    borderRadius: 5,
    backgroundColor: colors.surfaceRaised,
    marginTop: 5,
    marginLeft: 2,
  },
})
