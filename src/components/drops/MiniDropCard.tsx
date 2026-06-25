import type { DropWithParticipants } from '@/api/drops.api'
import type { PhotoWithUploader } from '@/api/photos.api'
import { colors, fontWeight, radii } from '@/theme'
import type { DropState } from '@/types/database.types'
import { shareDrop } from '@/utils/share'
import { MenuView } from '@expo/ui/community/menu'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
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
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${MONTHS[d.getMonth()]} ${d.getDate()} · ${hour}:${m} ${ampm}`
}

const STATE_ICON: Record<DropState, { name: string; color: string }> = {
  active:  { name: 'lock.fill',       color: colors.white },
  ready:   { name: 'lock.open.fill',  color: colors.white },
  open:    { name: 'photo.fill',      color: colors.white },
  expired: { name: 'xmark.circle',    color: colors.white },
}

function MiniDropCard({ drop, hPad = H_PAD, backTitle }: { drop: DropWithParticipants; hPad?: number; backTitle?: string }) {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - hPad - GAP * (COLS - 1)) / COLS)
  const cardHeight = Math.floor(cardWidth * (4 / 3))

  const navigate = () => router.push({ pathname: '/drop/[id]', params: { id: drop.id, backTitle } } as any)

  return (
    <MenuView
      shouldOpenOnLongPress
      style={{ width: cardWidth }}
      actions={[
        { id: 'open', title: 'View Drop', image: 'eye' },
        { id: 'share', title: 'Share', image: 'square.and.arrow.up' },
      ]}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'open') navigate()
        if (nativeEvent.event === 'share') shareDrop(drop.title, drop.id)
      }}
    >
      <TouchableOpacity
        style={{ width: cardWidth }}
        onPress={navigate}
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

        <View style={s.stateIcon}>
          <SymbolView
            name={STATE_ICON[drop.state].name as any}
            size={11}
            tintColor={STATE_ICON[drop.state].color}
            resizeMode="scaleAspectFit"
          />
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={s.gradient}
          pointerEvents="none"
        >
          <Text style={s.title} numberOfLines={1}>{drop.title}</Text>
        </LinearGradient>
      </View>

      <Text style={s.date}>{drop.state === 'open' || drop.state === 'expired' ? 'Opened' : 'Opens'} · {fmtShort(drop.open_date)}</Text>
      </TouchableOpacity>
    </MenuView>
  )
}

type MiniPhotoCardProps = {
  photo: PhotoWithUploader
  size: number
  blurred?: boolean
  onPress: () => void
}

export function MiniPhotoCard({ photo, size, blurred, onPress }: MiniPhotoCardProps) {
  const cardHeight = Math.floor(size * (4 / 3))
  const blurOpacity = useSharedValue(blurred ? 1 : 0)

  useEffect(() => {
    blurOpacity.value = withTiming(blurred ? 1 : 0, { duration: 300 })
  }, [blurred])

  const blurStyle = useAnimatedStyle(() => ({ opacity: blurOpacity.value }))

  const thumb = (
    <View style={[s.thumb, { width: size, height: cardHeight }]}>
      <Image
        source={{ uri: photo.cdn_url }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        recyclingKey={photo.id}
        transition={150}
      />
      <Animated.View style={[StyleSheet.absoluteFill, blurStyle]} pointerEvents="none">
        <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFill, s.blurOverlay]}>
          <View style={s.lockBadge}>
            <SymbolView name="lock.fill" size={11} tintColor={colors.bone} resizeMode="scaleAspectFit" />
            <Text style={s.lockBadgeText}>Locked</Text>
          </View>
        </BlurView>
      </Animated.View>
      {!blurred && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={s.photoGradient}
          pointerEvents="none"
        >
          <Text style={s.photoDate} numberOfLines={1}>{fmtShort(photo.uploaded_at)}</Text>
        </LinearGradient>
      )}
    </View>
  )

  if (blurred) {
    return (
      <View style={{ width: size }}>
        {thumb}
      </View>
    )
  }

  return (
    <MenuView
      shouldOpenOnLongPress
      style={{ width: size }}
      actions={[
        { id: 'view', title: 'View Photo', image: 'eye' },
        { id: 'share', title: 'Share', image: 'square.and.arrow.up' },
      ]}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'view') onPress()
      }}
    >
      <TouchableOpacity style={{ width: size }} onPress={onPress} activeOpacity={0.82}>
        {thumb}
      </TouchableOpacity>
    </MenuView>
  )
}

export function MiniDropGrid({ drops, hPad, backTitle }: { drops: DropWithParticipants[]; hPad?: number; backTitle?: string }) {
  return (
    <View style={s.grid}>
      {drops.map(drop => (
        <MiniDropCard key={drop.id} drop={drop} hPad={hPad} backTitle={backTitle} />
      ))}
    </View>
  )
}

function MiniDropCardSkeleton({ hPad = H_PAD }: { hPad?: number }) {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - hPad - GAP * (COLS - 1)) / COLS)
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

export function MiniDropGridSkeleton({ count = 6, hPad }: { count?: number; hPad?: number }) {
  return (
    <View style={s.grid}>
      {Array.from({ length: count }, (_, i) => (
        <MiniDropCardSkeleton key={i} hPad={hPad} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: GAP,
  },
  thumb: {
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceDeep,
  },
  placeholder: {
    backgroundColor: colors.surfaceRaised,
  },
  stateIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
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
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingTop: 20,
    paddingBottom: 6,
  },
  photoDate: {
    fontSize: 9,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  skeletonThumb: {
    backgroundColor: colors.surfaceRaised,
  },
  blurOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14,14,16,0.55)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.bone,
    letterSpacing: 0.2,
  },
  photoFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingTop: 28,
    paddingBottom: 8,
  },
  photoName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
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
