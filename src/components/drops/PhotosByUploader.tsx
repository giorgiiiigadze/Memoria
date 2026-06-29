import type { PhotoWithUploader } from '@/api/photos.api'
import { MiniPhotoCard } from '@/components/drops/MiniDropCard'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { formatDate } from '@/utils/date'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const COLS = 3
const GAP = 4

type Props = {
  photos: PhotoWithUploader[]
  thumbnailUrl?: string | null
  creatorName?: string | null
  creatorAvatarUrl?: string | null
  createdAt?: string | null
  onSelect: (photo: PhotoWithUploader) => void
  onDelete?: (photo: PhotoWithUploader) => void
  onPin?: (photo: PhotoWithUploader) => void
  bottomPad: number
  isLocked?: boolean
  currentUserId?: string
  emptyMessage?: string
}

export function PhotosByUploader({
  photos,
  thumbnailUrl,
  creatorName,
  creatorAvatarUrl,
  createdAt,
  onSelect,
  onDelete,
  onPin,
  bottomPad,
  isLocked,
  currentUserId,
  emptyMessage,
}: Props) {
  const { width } = useWindowDimensions()
  const tileSize = Math.floor((width - GAP * (COLS - 1)) / COLS)

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomPad }}
    >
      <View style={s.hero}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : null}
        {creatorName ? (
          <>
            <LinearGradient
              colors={[
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0.15)',
                'rgba(0,0,0,0.45)',
                'rgba(0,0,0,0.75)',
                'rgba(0,0,0,0.92)',
              ]}
              locations={[0, 0.25, 0.55, 0.82, 1]}
              style={s.heroGradient}
              pointerEvents="none"
            />
            <View style={s.heroFooter}>
              <InitialAvatar name={creatorName} avatarUrl={creatorAvatarUrl} size={36} />
              <View>
                <Text style={s.creatorName} numberOfLines={1}>{creatorName}</Text>
                {formatDate(createdAt) ? (
                  <Text style={s.createdAt} numberOfLines={1}>{formatDate(createdAt)}</Text>
                ) : null}
              </View>
            </View>
          </>
        ) : null}
      </View>
      <View style={s.divider} />
      {photos.length === 0 && emptyMessage ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <View style={s.grid}>
          {photos.map(photo => (
            <MiniPhotoCard
              key={photo.id}
              photo={photo}
              size={tileSize}
              blurred={!!isLocked && photo.uploader_id !== currentUserId}
              onPress={() => onSelect(photo)}
              showUploader
              isOwn={photo.uploader_id === currentUserId}
              onDelete={onDelete ? () => onDelete(photo) : undefined}
              onPin={onPin ? () => onPin(photo) : undefined}
            />
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  hero: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  heroFooter: {
    position: 'absolute',
    bottom: spacing[5],
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  creatorName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: fontWeight.medium,
  },
  createdAt: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: fontWeight.regular,
    marginTop: 1,
  },
  divider: {
    height: spacing[5],
    backgroundColor: colors.background,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  emptyWrap: {
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[8],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 20,
  },
})


export function PhotosByUploaderSkeleton({ topInset: _ }: { topInset: number }) {
  const { width } = useWindowDimensions()
  const tileSize = Math.floor((width - GAP * (COLS - 1)) / COLS)
  const tileHeight = Math.floor(tileSize * (4 / 3))

  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,    { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
    return () => cancelAnimation(opacity)
  }, [])

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <ScrollView scrollEnabled={false} contentContainerStyle={{ paddingBottom: spacing[10] }}>
      {/* Hero */}
      <Animated.View style={[sk.hero, pulse]}>
        <View style={sk.heroFooter}>
          <View style={sk.avatar} />
          <View style={sk.textLines}>
            <View style={[sk.line, { width: 100 }]} />
            <View style={[sk.line, { width: 64, marginTop: 5 }]} />
          </View>
        </View>
      </Animated.View>

      {/* Divider */}
      <View style={sk.divider} />

      {/* Grid */}
      <Animated.View style={[sk.grid, pulse]}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={[sk.tile, { width: tileSize, height: tileHeight }]} />
        ))}
      </Animated.View>
    </ScrollView>
  )
}

const sk = StyleSheet.create({
  hero: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceRaised,
  },
  heroFooter: {
    position: 'absolute',
    bottom: spacing[5],
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  textLines: {
    gap: 0,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  divider: {
    height: spacing[5],
    backgroundColor: colors.background,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.photo,
  },
})
