import type { DropWithParticipants } from '@/api/drops.api'
import type { PhotoWithUploader } from '@/api/photos.api'
import { colors, fontWeight, radii } from '@/theme'
import type { DropState } from '@/types/database.types'
import { fmtDropDate, timeAgo } from '@/utils/date'
import { shareDrop } from '@/utils/share'
import { MenuView } from '@expo/ui/community/menu'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

const COLS = 3
const GAP = 4
const H_PAD = 40


const STATE_ICON: Record<DropState, { name: string; color: string }> = {
  active:  { name: 'lock.fill',       color: colors.white },
  ready:   { name: 'lock.open.fill',  color: colors.white },
  open:    { name: 'photo.fill',      color: colors.white },
  expired: { name: 'xmark.circle',    color: colors.white },
}

function MiniDropCard({ drop, hPad = H_PAD, backTitle, isCreator, onPin, cols = COLS, borderRadius }: {
  drop: DropWithParticipants
  hPad?: number
  backTitle?: string
  isCreator?: boolean
  onPin?: () => void
  cols?: number
  borderRadius?: number
}) {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - hPad - GAP * (cols - 1)) / cols)
  const cardHeight = Math.floor(cardWidth * (4 / 3))

  const navigate = () => router.push({ pathname: '/drop/[id]', params: { id: drop.id, backTitle } } as any)

  return (
    <MenuView
      shouldOpenOnLongPress
      style={{ width: cardWidth }}
      actions={[
        { id: 'open', title: 'View Drop', image: 'eye' as const },
        { id: 'share', title: 'Share', image: 'square.and.arrow.up' as const },
        ...(onPin ? [{ id: 'pin', title: drop.is_pinned ? 'Unpin Drop' : 'Pin Drop', image: drop.is_pinned ? 'pin.slash' as const : 'pin' as const }] : []),
      ]}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'open') navigate()
        if (nativeEvent.event === 'share') shareDrop(drop.title, drop.id)
        if (nativeEvent.event === 'pin') onPin?.()
      }}
    >
      <TouchableOpacity
        style={{ width: cardWidth }}
        onPress={navigate}
        activeOpacity={0.82}
      >
      <View style={[s.thumb, { width: cardWidth, height: cardHeight }, borderRadius !== undefined && { borderRadius }]}>
        {drop.thumbnail_url ? (
          <Image
            source={{ uri: drop.thumbnail_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, s.placeholder]} />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={s.gradient}
          pointerEvents="none"
        >
          <Text style={s.title} numberOfLines={1}>{drop.title}</Text>
          <Text style={s.date} numberOfLines={1}>{fmtDropDate(drop.state, drop.open_date)}</Text>
        </LinearGradient>

        {drop.is_pinned && (
          <View style={s.dropPinBadge} pointerEvents="none">
            <SymbolView name="pin.fill" size={18} tintColor={colors.white} resizeMode="scaleAspectFit" />
          </View>
        )}
      </View>
      </TouchableOpacity>
    </MenuView>
  )
}

type MiniPhotoCardProps = {
  photo: PhotoWithUploader
  size: number
  blurred?: boolean
  onPress: () => void
  showUploader?: boolean
  isOwn?: boolean
  onDelete?: () => void
  onPin?: () => void
}

export function MiniPhotoCard({ photo, size, blurred, onPress, showUploader, isOwn, onDelete, onPin }: MiniPhotoCardProps) {
  const cardHeight = Math.floor(size * (4 / 3))
  const blurOpacity = useSharedValue(blurred ? 1 : 0)

  useEffect(() => {
    blurOpacity.value = withTiming(blurred ? 1 : 0, { duration: 300 })
  }, [blurred])

  const blurStyle = useAnimatedStyle(() => ({ opacity: blurOpacity.value }))

  const uploaderName = photo.uploader?.display_name ?? photo.uploader?.username ?? null

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
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={s.photoGradient}
        pointerEvents="none"
      >
        {showUploader && uploaderName && (
          <Text style={s.photoName} numberOfLines={1}>{uploaderName}</Text>
        )}
        <Text style={s.photoDate} numberOfLines={1}>{timeAgo(photo.uploaded_at)}</Text>
      </LinearGradient>
      {photo.is_pinned && (
        <View style={s.pinBadge} pointerEvents="none">
          <SymbolView name="pin.fill" size={18} tintColor={colors.white} resizeMode="scaleAspectFit" />
        </View>
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
        { id: 'view', title: 'View Photo', image: 'eye' as const },
        { id: 'save', title: 'Save to Camera Roll', image: 'photo.badge.arrow.down' as const },
        { id: 'share', title: 'Share', image: 'square.and.arrow.up' as const },
        ...(onPin ? [{ id: 'pin', title: photo.is_pinned ? 'Unpin Photo' : 'Pin Photo', image: photo.is_pinned ? 'pin.slash' as const : 'pin' as const }] : []),
        ...(isOwn && onDelete ? [{ id: 'delete', title: 'Delete Photo', image: 'trash' as const, attributes: { destructive: true } }] : []),
      ]}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'view') onPress()
        if (nativeEvent.event === 'save') Alert.alert('Coming soon', 'Photo saving will be available in a future update.')
        if (nativeEvent.event === 'pin') onPin?.()
        if (nativeEvent.event === 'delete') onDelete?.()
      }}
    >
      <TouchableOpacity style={{ width: size }} onPress={onPress} activeOpacity={0.82}>
        {thumb}
      </TouchableOpacity>
    </MenuView>
  )
}

export function MiniDropGrid({ drops, hPad, backTitle, currentUserId, onPin, cols, borderRadius }: {
  drops: DropWithParticipants[]
  hPad?: number
  backTitle?: string
  currentUserId?: string
  onPin?: (drop: DropWithParticipants) => void
  cols?: number
  borderRadius?: number
}) {
  return (
    <View style={s.grid}>
      {drops.map(drop => (
        <MiniDropCard
          key={drop.id}
          drop={drop}
          hPad={hPad}
          backTitle={backTitle}
          isCreator={!!currentUserId && drop.creator_id === currentUserId}
          onPin={onPin ? () => onPin(drop) : undefined}
          cols={cols}
          borderRadius={borderRadius}
        />
      ))}
    </View>
  )
}

function MiniDropCardSkeleton({ hPad = H_PAD, cols = COLS }: { hPad?: number; cols?: number }) {
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - hPad - GAP * (cols - 1)) / cols)
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
    </Animated.View>
  )
}

export function MiniDropGridSkeleton({ count = 6, hPad, cols }: { count?: number; hPad?: number; cols?: number }) {
  return (
    <View style={s.grid}>
      {Array.from({ length: count }, (_, i) => (
        <MiniDropCardSkeleton key={i} hPad={hPad} cols={cols} />
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
    borderRadius: radii.photo,
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
    fontSize: 12,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
  },
  date: {
    fontSize: 11,
    fontWeight: fontWeight.semiBold,
    color: colors.textOverlay,
    marginTop: 2,
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingTop: 32,
    paddingBottom: 6,
  },
  photoDate: {
    fontSize: 12,
    fontWeight: fontWeight.semiBold,
    color: colors.textOverlay,
  },
  pinBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  dropPinBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  skeletonThumb: {
    backgroundColor: colors.surfaceRaised,
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
    fontSize: 12,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
  },
})
