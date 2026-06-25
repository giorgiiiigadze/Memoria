import type { PhotoWithUploader } from '@/api/photos.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { GlassContainer, GlassView } from 'expo-glass-effect'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { SymbolView } from 'expo-symbols'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SW = Dimensions.get('window').width
const SH = Dimensions.get('window').height
const DISMISS_THRESHOLD = 60

type Props = {
  photos: PhotoWithUploader[]
  initialIndex: number
  visible: boolean
  onClose: () => void
}

export function StoryViewer({ photos, initialIndex, visible, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(initialIndex)

  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const translateY = useRef(new Animated.Value(0)).current
  const translateX = useRef(new Animated.Value(0)).current
  const segmentProgress = useRef(new Animated.Value(0)).current

  // Track live translateY so PanResponder grant can pick up from mid-animation
  const currentY = useRef(0)
  useEffect(() => {
    const id = translateY.addListener(({ value }: { value: number }) => { currentY.current = value })
    return () => translateY.removeListener(id)
  }, [translateY])

  // Everything derived from translateY — single source of truth for drag state
  const bgOpacity = translateY.interpolate({
    inputRange: [0, SH * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  // Photo card scales from 1 → 0.72 — more card-like as you drag
  const photoScale = translateY.interpolate({
    inputRange: [0, SH * 0.55],
    outputRange: [1, 0.72],
    extrapolate: 'clamp',
  })

  // Overlays fade fast (first 80px) so only the photo remains during drag
  const overlayOpacity = translateY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  // Horizontal resistance: 15% of actual drag, clamped to screen edges
  const resistedX = translateX.interpolate({
    inputRange: [-SW, 0, SW],
    outputRange: [-SW * 0.15, 0, SW * 0.15],
    extrapolate: 'clamp',
  })

  useEffect(() => {
    if (visible) setIndex(initialIndex)
  }, [visible, initialIndex])

  useEffect(() => {
    if (visible) {
      translateY.setValue(0)
      translateX.setValue(0)
    }
  }, [visible])

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

  // Segment fill animation — visual only, in sync with the 5s timer above
  useEffect(() => {
    if (!visible) return
    segmentProgress.setValue(0)
    Animated.timing(segmentProgress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start()
    return () => segmentProgress.stopAnimation()
  }, [visible, index])

  function dismiss(vy = 0) {
    // Faster dismiss when flicked — cap at 160ms, floor at 280ms
    const duration = Math.max(160, 280 - Math.min(vy, 3) * 40)
    Animated.timing(translateY, {
      toValue: SH,
      duration,
      useNativeDriver: true,
    }).start(() => {
      // Don't reset values here — the photo stays off-screen (translateY=SH)
      // until the modal is gone. Resetting before onClose causes a one-frame
      // flash where the photo jumps back to full position while the modal
      // is still mounted. The visible=true useEffect resets on next open.
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

  // Offset saved at grant so the card doesn't jump when PanResponder steals
  // the touch from Pressable after the initial movement threshold.
  const grantDyRef = useRef(0)
  const grantDxRef = useRef(0)

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: (_, g) => {
        // Capture grant-time gesture position + current animated position
        // so move handler produces zero-jump displacement from here
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
        if (dy > DISMISS_THRESHOLD || g.vy > 0.8) {
          dismiss(g.vy)
        } else {
          snapBack()
        }
      },
      onPanResponderTerminate: () => snapBack(),
      onPanResponderTerminateRequest: () => false,
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

  return (
    <Modal
      visible={visible}
      transparent
      presentationStyle="overFullScreen"
      animationType="fade"
    >
      {/* Background fully fades to transparent so you see through during drag */}
      <Animated.View
        style={[StyleSheet.absoluteFill, s.bg, { opacity: bgOpacity }]}
        pointerEvents="none"
      />

      {/* Photo card: translate + horizontal resistance + scale */}
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
          style={[s.photo, { top: insets.top }]}
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
          style={s.bottomGradient}
          pointerEvents="none"
        />

        <Pressable
          style={[StyleSheet.absoluteFill, { top: insets.top }]}
          onPress={e => handleTap(e.nativeEvent.locationX)}
        />

        {/* Header fades within first 80px of drag so only the photo remains */}
        <Animated.View style={[s.header, { opacity: overlayOpacity }]}>
          <GlassContainer>
            <Pressable onPress={() => dismiss()}>
              <GlassView isInteractive colorScheme="light" style={s.glassCloseBtn}>
                <SymbolView name="chevron.down" size={18} tintColor={colors.white} resizeMode="scaleAspectFit" />
              </GlassView>
            </Pressable>
          </GlassContainer>

          <View style={s.progressRow}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[s.seg, i < index ? s.segFilled : s.segEmpty]}
              >
                {i === index && (
                  <Animated.View
                    style={[
                      s.segActiveFill,
                      {
                        width: segmentProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom bar fades in sync with header */}
        <Animated.View
          style={[
            s.bottomBar,
            { paddingBottom: insets.bottom + spacing[6], opacity: overlayOpacity },
          ]}
        >
          <InitialAvatar name={name} avatarUrl={photo.uploader?.avatar_url ?? null} size={28} />
          <Text style={s.uploaderName} numberOfLines={1}>{name}</Text>
          <Text style={s.counter}>{index + 1} / {photos.length}</Text>
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
    bottom: spacing[12],
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
    bottom: spacing[12],
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
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    height: 16,
  },
  seg: {
    flex: 1,
    height: 2.5,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  segFilled: {
    backgroundColor: colors.bone,
  },
  segEmpty: {
    backgroundColor: 'rgba(242,238,230,0.35)',
  },
  segActiveFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.bone,
  },
  glassCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  uploaderName: {
    flex: 1,
    color: colors.bone,
    fontSize: 15,
    fontWeight: fontWeight.semiBold,
  },
  counter: {
    color: 'rgba(242,238,230,0.6)',
    fontSize: 13,
  },
})
