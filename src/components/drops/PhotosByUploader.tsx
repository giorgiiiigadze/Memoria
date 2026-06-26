import type { PhotoWithUploader } from '@/api/photos.api'
import { MiniPhotoCard } from '@/components/drops/MiniDropCard'
import { colors, radii, spacing } from '@/theme'
import { useEffect } from 'react'
import {
  ScrollView,
  StyleSheet,
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
  onSelect: (photo: PhotoWithUploader) => void
  onDelete?: (photo: PhotoWithUploader) => void
  topInset: number
  bottomPad: number
  isLocked?: boolean
  currentUserId?: string
}

export function PhotosByUploader({
  photos,
  onSelect,
  onDelete,
  topInset,
  bottomPad,
  isLocked,
  currentUserId,
}: Props) {
  const { width } = useWindowDimensions()
  const tileSize = Math.floor((width - GAP * (COLS - 1)) / COLS)

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomPad }}
    >
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
          />
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
})


export function PhotosByUploaderSkeleton({ topInset }: { topInset: number }) {
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
    <ScrollView scrollEnabled={false} contentContainerStyle={{ paddingTop: topInset, paddingBottom: spacing[10] }}>
      <View style={sk.grid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <Animated.View key={i} style={[sk.tile, pulse, { width: tileSize, height: tileHeight }]} />
        ))}
      </View>
    </ScrollView>
  )
}

const sk = StyleSheet.create({
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
