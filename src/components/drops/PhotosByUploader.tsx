import type { PhotoWithUploader } from '@/api/photos.api'
import { MiniPhotoCard } from '@/components/drops/MiniDropCard'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { useEffect } from 'react'
import {
  ScrollView,
  SectionList,
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


type PhotoRow = PhotoWithUploader[]

type UploaderSection = {
  key: string
  uploader: { username: string; display_name: string | null; avatar_url: string | null } | null
  isCurrentUser: boolean
  photoCount: number
  data: PhotoRow[]
}

function groupPhotos(photos: PhotoWithUploader[], currentUserId?: string): UploaderSection[] {
  const map = new Map<string, PhotoWithUploader[]>()
  for (const photo of photos) {
    const uid = photo.uploader_id ?? 'unknown'
    if (!map.has(uid)) map.set(uid, [])
    map.get(uid)!.push(photo)
  }

  const sections: UploaderSection[] = []
  for (const [uid, uploaderPhotos] of map) {
    const rows: PhotoRow[] = []
    for (let i = 0; i < uploaderPhotos.length; i += COLS) {
      rows.push(uploaderPhotos.slice(i, i + COLS))
    }
    sections.push({
      key: uid,
      uploader: uploaderPhotos[0].uploader,
      isCurrentUser: uid === currentUserId,
      photoCount: uploaderPhotos.length,
      data: rows,
    })
  }

  // Current user first, then by photo count descending
  sections.sort((a, b) => {
    if (a.isCurrentUser) return -1
    if (b.isCurrentUser) return 1
    return b.photoCount - a.photoCount
  })

  return sections
}

type Props = {
  photos: PhotoWithUploader[]
  onSelect: (photo: PhotoWithUploader) => void
  topInset: number
  bottomPad: number
  isLocked?: boolean
  currentUserId?: string
}

export function PhotosByUploader({
  photos,
  onSelect,
  topInset,
  bottomPad,
  isLocked,
  currentUserId,
}: Props) {
  const { width } = useWindowDimensions()
  const tileSize = Math.floor((width - GAP * (COLS - 1)) / COLS)
  const sections = groupPhotos(photos, currentUserId)

  return (
    <SectionList
      sections={sections}
      keyExtractor={(row, i) => `${row[0]?.id ?? 'empty'}-${i}`}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingTop: topInset, paddingBottom: bottomPad }}
      renderSectionHeader={({ section }) => {
        const name = section.uploader?.display_name ?? section.uploader?.username ?? 'Unknown'
        return (
          <View style={s.sectionHeader}>
            <InitialAvatar name={name} avatarUrl={section.uploader?.avatar_url} size={30} />
            <View style={s.uploaderInfo}>
              <Text style={s.uploaderName} numberOfLines={1}>{name}</Text>
              <Text style={s.count}>
                {section.photoCount} {section.photoCount === 1 ? 'photo' : 'photos'}
              </Text>
            </View>
          </View>
        )
      }}
      renderItem={({ item: row }) => (
        <View style={s.row}>
          {row.map(photo => (
            <MiniPhotoCard
              key={photo.id}
              photo={photo}
              size={tileSize}
              blurred={!!isLocked && photo.uploader_id !== currentUserId}
              onPress={() => onSelect(photo)}
            />
          ))}
          {row.length < COLS && Array.from({ length: COLS - row.length }, (_, i) => (
            <View key={`gap-${i}`} style={{ width: tileSize }} />
          ))}
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      renderSectionFooter={() => <View style={{ height: spacing[2] }} />}
    />
  )
}


const s = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  uploaderInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  uploaderName: {
    fontSize: 14,
    fontWeight: fontWeight.strong,
    color: colors.white,
  },
  count: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
})

// ─── Skeleton ────────────────────────────────────────────────────────────────

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
      {Array.from({ length: 3 }).map((_, si) => (
        <View key={si} style={{ marginBottom: spacing[2] }}>

          {/* Section header */}
          <View style={sk.header}>
            <Animated.View style={[sk.avatar, pulse]} />
            <View style={{ flex: 1, gap: 3 }}>
              <Animated.View style={[sk.nameLine, pulse, { width: 72 + si * 24 }]} />
              <Animated.View style={[sk.countLine, pulse]} />
            </View>
          </View>

          {/* Photo rows */}
          {Array.from({ length: 2 }).map((_, ri) => (
            <View key={ri} style={[sk.row, ri > 0 && { marginTop: GAP }]}>
              {Array.from({ length: COLS }).map((_, ci) => (
                <View key={ci} style={{ width: tileSize }}>
                  <Animated.View style={[sk.tile, pulse, { width: tileSize, height: tileHeight }]} />
                  <Animated.View style={[sk.dateStub, pulse]} />
                </View>
              ))}
            </View>
          ))}

        </View>
      ))}
    </ScrollView>
  )
}

const sk = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceRaised,
  },
  nameLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceRaised,
  },
  countLine: {
    width: 48,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceRaised,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  tile: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
  },
  dateStub: {
    height: 10,
    width: 32,
    borderRadius: 5,
    backgroundColor: colors.surfaceRaised,
    marginTop: 4,
    marginLeft: 2,
  },
})
