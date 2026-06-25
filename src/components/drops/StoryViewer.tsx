import type { PhotoWithUploader } from '@/api/photos.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { GlassContainer, GlassView } from 'expo-glass-effect'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { SymbolView } from 'expo-symbols'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SW = Dimensions.get('window').width
const SH = Dimensions.get('window').height
const DISMISS_THRESHOLD = 50

const THUMB_W            = 48
const THUMB_H            = 64   // 3:4 ratio
const THUMB_GAP          = 6
const THUMB_ITEM_W       = THUMB_W + THUMB_GAP
const FILMSTRIP_H        = 96
const FILMSTRIP_PAD      = SW / 2 - THUMB_W / 2
// ─── Filmstrip thumb ──────────────────────────────────────────────────────────

function FilmstripThumb({
  item,
  isActive,
  onPress,
}: {
  item: PhotoWithUploader
  isActive: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={{ marginRight: THUMB_GAP }}>
      <View style={[ft.thumb, isActive && ft.thumbActive]}>
        <Image source={{ uri: item.cdn_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
      </View>
    </Pressable>
  )
}

const ft = StyleSheet.create({
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: radii.md,
    overflow: 'hidden',
    opacity: 0.5,
  },
  thumbActive: {
    opacity: 1,
  },
})

// ─── Story viewer ─────────────────────────────────────────────────────────────

type Props = {
  photos: PhotoWithUploader[]
  initialIndex: number
  visible: boolean
  onClose: () => void
}

export function StoryViewer({ photos, initialIndex, visible, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(initialIndex)

  const onCloseRef   = useRef(onClose)
  const filmstripRef = useRef<ScrollView>(null)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const translateY = useRef(new Animated.Value(0)).current
  const translateX = useRef(new Animated.Value(0)).current

  const currentY = useRef(0)
  useEffect(() => {
    const id = translateY.addListener(({ value }: { value: number }) => { currentY.current = value })
    return () => translateY.removeListener(id)
  }, [translateY])

  const bgOpacity = translateY.interpolate({
    inputRange: [0, SH * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const photoScale = translateY.interpolate({
    inputRange: [0, SH * 0.55],
    outputRange: [1, 0.72],
    extrapolate: 'clamp',
  })

  const overlayOpacity = translateY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const resistedX = translateX.interpolate({
    inputRange: [-SW, 0, SW],
    outputRange: [-SW * 0.15, 0, SW * 0.15],
    extrapolate: 'clamp',
  })

  useLayoutEffect(() => {
    if (!visible) return
    translateY.stopAnimation()
    translateX.stopAnimation()
    translateY.setValue(0)
    translateX.setValue(0)
    setIndex(initialIndex)
  }, [visible, initialIndex])

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      if (index === photos.length - 1) {
        onCloseRef.current()
      } else {
        setIndex(i => i + 1)
      }
    }, 5000)
    return () => clearTimeout(t)
  }, [visible, index])

  useEffect(() => {
    if (!filmstripRef.current) return
    filmstripRef.current.scrollTo({ x: index * THUMB_ITEM_W, animated: true })
  }, [index])

  function dismiss(vy = 0) {
    const duration = Math.max(160, 280 - Math.min(vy, 3) * 40)
    Animated.timing(translateY, {
      toValue: SH,
      duration,
      useNativeDriver: true,
    }).start(() => {
      onCloseRef.current()
    })
  }

  function snapBack() {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 220,
        friction: 24,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 220,
        friction: 24,
      }),
    ]).start()
  }

  const grantDyRef = useRef(0)
  const grantDxRef = useRef(0)

  const pan = useRef(
    PanResponder.create({
      // Bubble phase: steal from Pressable once clearly dragging down
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 2 && Math.abs(g.dy) > Math.abs(g.dx),

      // Capture phase: beat nested scroll views on strong vertical drag
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dy > 10 && Math.abs(g.dy) > Math.abs(g.dx) * 2,

      onPanResponderGrant: (_, g) => {
        grantDyRef.current = g.dy - currentY.current
        grantDxRef.current = g.dx
        translateY.stopAnimation()
        translateX.stopAnimation()
      },
      onPanResponderMove: (_, g) => {
        const dy = g.dy - grantDyRef.current
        if (dy < 0) return
        translateY.setValue(dy)
        translateX.setValue(g.dx - grantDxRef.current)
      },
      onPanResponderRelease: (_, g) => {
        const dy = g.dy - grantDyRef.current
        if (dy > DISMISS_THRESHOLD || g.vy > 0.5) {
          dismiss(g.vy)
        } else {
          snapBack()
        }
      },
      onPanResponderTerminate: () => snapBack(),
      onPanResponderTerminationRequest: () => false,
    })
  ).current

  const photo = photos[index]
  if (!photo) return null

  const name = photo.uploader?.display_name ?? photo.uploader?.username ?? ''

  function handleTap(locationX: number) {
    if (locationX < SW / 2) {
      setIndex(i => Math.max(0, i - 1))
    } else {
      if (index === photos.length - 1) {
        onCloseRef.current()
      } else {
        setIndex(i => i + 1)
      }
    }
  }

  const photoBottom = insets.bottom + FILMSTRIP_H

  return (
    <Modal
      visible={visible}
      transparent
      presentationStyle="overFullScreen"
      animationType="fade"
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, s.bg, { opacity: bgOpacity }]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          s.root,
          { paddingTop: insets.top },
          {
            transform: [
              { translateY },
              { translateX: resistedX },
              { scale: photoScale },
            ],
          },
        ]}
        {...pan.panHandlers}
      >
        <Image
          source={{ uri: photo.cdn_url }}
          style={[s.photo, { top: insets.top, bottom: photoBottom }]}
          contentFit="cover"
          contentPosition="center"
        />

        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'transparent']}
          style={[s.topGradient, { top: insets.top }]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={[s.bottomGradient, { bottom: photoBottom }]}
          pointerEvents="none"
        />

        <Pressable
          style={[StyleSheet.absoluteFill, { top: insets.top, bottom: photoBottom }]}
          onPress={e => handleTap(e.nativeEvent.locationX)}
        />

        {/* Header: close + uploader info */}
        <Animated.View style={[s.header, { opacity: overlayOpacity }]}>
          <GlassContainer>
            <Pressable onPress={() => dismiss()}>
              <GlassView isInteractive colorScheme="light" style={s.glassCloseBtn}>
                <SymbolView name="chevron.down" size={18} tintColor={colors.white} resizeMode="scaleAspectFit" />
              </GlassView>
            </Pressable>
          </GlassContainer>

          <View style={s.uploaderInfo}>
            <InitialAvatar name={name} avatarUrl={photo.uploader?.avatar_url ?? null} size={24} />
            <Text style={s.uploaderName} numberOfLines={1}>{name}</Text>
          </View>
        </Animated.View>

        {/* Bottom filmstrip */}
        <Animated.View
          style={[s.filmstrip, { paddingBottom: insets.bottom + spacing[3], opacity: overlayOpacity }]}
          pointerEvents="box-none"
        >
          <View style={s.filmstripTrack}>
            <ScrollView
              ref={filmstripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={s.filmstripContent}
            >
              {photos.map((item, i) => (
                <FilmstripThumb
                  key={i}
                  item={item}
                  isActive={i === index}
                  onPress={() => setIndex(i)}
                />
              ))}
            </ScrollView>

            <LinearGradient
              colors={['rgba(0,0,0,0.85)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.filmstripFadeLeft}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.filmstripFadeRight}
              pointerEvents="none"
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const s = StyleSheet.create({
  bg: {
    backgroundColor: '#000',
  },
  root: {
    flex: 1,
  },
  photo: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: 'rgba(242,238,230,0.18)',
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 140,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  header: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    maxWidth: 130,
  },
  uploaderName: {
    color: colors.bone,
    fontSize: 13,
    fontWeight: fontWeight.semiBold,
    flexShrink: 1,
  },
  glassCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filmstrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing[2],
  },
  filmstripTrack: {
    position: 'relative',
  },
  filmstripContent: {
    paddingHorizontal: FILMSTRIP_PAD,
    alignItems: 'center',
  },
  filmstripFadeLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 56,
  },
  filmstripFadeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 56,
  },
})
