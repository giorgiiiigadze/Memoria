import { consumeStoryCache, getDropPhotos, type PhotoWithUploader } from '@/api/photos.api'
import { DropHeaderMenu } from '@/components/drops/DropHeaderMenu'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { timeAgo } from '@/utils/date'
import { MenuView } from '@expo/ui/community/menu'
import { GlassContainer, GlassView } from 'expo-glass-effect'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SW                = Dimensions.get('window').width
const SH                = Dimensions.get('window').height
const DISMISS_THRESHOLD = 80
const DISMISS_VELOCITY  = 800
const THUMB_SIZE        = 40
const THUMB_GAP         = 4
const THUMB_RADIUS      = 6
const FILMSTRIP_CLEARANCE = THUMB_SIZE + spacing[2] + spacing[3]

export default function StoryScreen() {
  const { dropId, index: indexParam } = useLocalSearchParams<{ dropId: string; index: string }>()
  const insets = useSafeAreaInsets()

  const [photos, setPhotos] = useState<PhotoWithUploader[]>(() => consumeStoryCache())
  const [index, setIndex]   = useState(parseInt(indexParam ?? '0', 10))
  const filmstripRef = useRef<ScrollView>(null)

  const translateY = useSharedValue(0)
  const translateX = useSharedValue(0)

  const indexRef     = useRef(index)
  indexRef.current   = index
  const photosLenRef = useRef(photos.length)
  photosLenRef.current = photos.length

  useEffect(() => {
    if (!dropId) return
    getDropPhotos(dropId).then(setPhotos).catch(console.error)
  }, [dropId])

  useEffect(() => {
    filmstripRef.current?.scrollTo({ x: index * (THUMB_SIZE + THUMB_GAP), animated: true })
  }, [index])

  const goBack = () => router.back()

  function onPhotoTap(x: number) {
    const i = indexRef.current
    if (x < SW / 2) {
      setIndex(Math.max(0, i - 1))
    } else if (i >= photosLenRef.current - 1) {
      router.back()
    } else {
      setIndex(i + 1)
    }
  }

  const tapGesture = Gesture.Tap()
    .onEnd(e => { runOnJS(onPhotoTap)(e.x) })

  const panGesture = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate(e => {
      if (e.translationY < 0) return
      translateY.value = e.translationY
      translateX.value = e.translationX * 0.15
    })
    .onEnd(e => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > DISMISS_VELOCITY) {
        const duration = Math.max(160, 280 - Math.min(e.velocityY / 1000, 3) * 40)
        translateY.value = withTiming(SH, { duration }, () => { runOnJS(goBack)() })
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 })
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 })
      }
    })
    .onFinalize((_, success) => {
      if (!success) {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 })
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 })
      }
    })


  // ─── Close tap for X button (inside RNGH system) ───────────────────────────
  const closeTap = Gesture.Tap().onEnd(() => { runOnJS(goBack)() })

  // ─── Animated styles ────────────────────────────────────────────────────────
  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SH * 0.5], [1, 0], Extrapolation.CLAMP),
  }))

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: interpolate(translateY.value, [0, SH * 0.55], [1, 0.72], Extrapolation.CLAMP) },
    ],
  }))

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
  }))

  const photo = photos[index]
  if (!photo) return (
    <View style={[s.root, s.loadingCenter]}>
      <ActivityIndicator color={colors.white} size="large" />
    </View>
  )

  return (
    <View style={s.root}>

      <Reanimated.View style={[StyleSheet.absoluteFill, s.bg, bgStyle]} pointerEvents="none" />

      <GestureDetector gesture={Gesture.Race(tapGesture, panGesture)}>
        <Reanimated.View style={[s.fill, cardStyle]}>
          <View style={[s.cardContainer, {
            paddingTop: insets.top + 44 + spacing[2],
            paddingBottom: insets.bottom + FILMSTRIP_CLEARANCE,
          }]}>
            <View style={s.photoWrap}>
              <Image
                source={{ uri: photo.cdn_url }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
                transition={0}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)']}
                style={s.bottomGradient}
                pointerEvents="none"
              />
              <MenuView
                shouldOpenOnLongPress
                style={StyleSheet.absoluteFill}
                actions={[{ id: 'save', title: 'Save to Camera Roll', image: 'photo.badge.arrow.down' }]}
                onPressAction={() => Alert.alert('Coming soon', 'Photo saving will be available in a future update.')}
              >
                <View style={StyleSheet.absoluteFill} />
              </MenuView>
            </View>

            <View style={s.reactionsContainer}>
              <Text style={s.reactionsEmpty}>No reactions yet</Text>
            </View>
          </View>
        </Reanimated.View>
      </GestureDetector>

      <Reanimated.View
        style={[s.header, { paddingTop: insets.top }, overlayStyle]}
        pointerEvents="box-none"
      >
        <View style={s.headerRow}>
          <GlassContainer>
            <GestureDetector gesture={closeTap}>
              <GlassView isInteractive colorScheme="light" style={s.glassBtn}>
                <SymbolView name="chevron.down" size={16} tintColor={colors.white} resizeMode="scaleAspectFit" />
              </GlassView>
            </GestureDetector>
          </GlassContainer>

          <Text style={s.headerTitle} numberOfLines={1}>{timeAgo(photo.uploaded_at)}</Text>

          <DropHeaderMenu id={dropId ?? ''} />
        </View>
      </Reanimated.View>

      <Reanimated.View
        style={[s.filmstrip, { bottom: insets.bottom + spacing[2] }, overlayStyle]}
        pointerEvents="box-none"
      >
        <ScrollView
          ref={filmstripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filmstripContent}
          scrollEventThrottle={16}
        >
          {photos.map((p, i) => (
            <Pressable
              key={p.id}
              style={[s.thumbWrap, i !== 0 && { marginLeft: THUMB_GAP }]}
              onPress={() => setIndex(i)}
            >
              <Image source={{ uri: p.cdn_url }} style={s.thumbImg} contentFit="cover" recyclingKey={p.id} />
              {i !== index && <View style={s.thumbDim} pointerEvents="none" />}
            </Pressable>
          ))}
        </ScrollView>
      </Reanimated.View>

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bg:   { backgroundColor: '#000' },
  fill: { flex: 1 },

  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[3],
  },

  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
    textAlign: 'center',
  },

  photoWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.surfaceDeep,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 120,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },

  reactionsContainer: {
    backgroundColor: 'rgb(142, 11, 11)',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  reactionsEmpty: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
  },

  filmstrip: {
    position: 'absolute',
    left: 0, right: 0,
  },
  filmstripContent: {
    paddingHorizontal: (SW - THUMB_SIZE) / 2,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_RADIUS,
    overflow: 'hidden',
  },
  thumbImg: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  thumbDim: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: THUMB_RADIUS,
  },
  loadingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
