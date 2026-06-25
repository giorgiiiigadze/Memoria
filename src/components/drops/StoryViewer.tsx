import type { PhotoWithUploader } from '@/api/photos.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, fontWeight, radii, spacing } from '@/theme'
import { GlassContainer, GlassView } from 'expo-glass-effect'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { SymbolView } from 'expo-symbols'
import { useEffect, useRef } from 'react'
import { useState } from 'react'
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
const DISMISS_THRESHOLD = 80

type Props = {
  photos: PhotoWithUploader[]
  initialIndex: number
  visible: boolean
  onClose: () => void
}

export function StoryViewer({ photos, initialIndex, visible, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(initialIndex)

  // Keep onClose ref-stable so PanResponder (created once) always calls current version
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const translateY = useRef(new Animated.Value(0)).current
  const bgOpacity = useRef(new Animated.Value(1)).current

  // Derived values from drag position
  const contentScale = translateY.interpolate({
    inputRange: [0, SH * 0.5],
    outputRange: [1, 0.88],
    extrapolate: 'clamp',
  })

  useEffect(() => {
    if (visible) setIndex(initialIndex)
  }, [visible, initialIndex])

  // Reset animation values each time the modal opens
  useEffect(() => {
    if (visible) {
      translateY.setValue(0)
      bgOpacity.setValue(1)
    }
  }, [visible])

  // Auto-advance story
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

  function dismiss() {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SH,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateY.setValue(0)
      bgOpacity.setValue(1)
      onCloseRef.current()
    })
  }

  function snapBack() {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 10,
      }),
      Animated.spring(bgOpacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 10,
      }),
    ]).start()
  }

  // Offset saved at grant time so the view doesn't jump when PanResponder
  // steals the touch from the Pressable after the initial movement threshold.
  const grantDyRef = useRef(0)

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: (_, g) => {
        // @ts-ignore — read current value to preserve position on re-grab during snap-back
        const currentY = (translateY._value as number) ?? 0
        grantDyRef.current = g.dy - currentY
        translateY.stopAnimation()
        bgOpacity.stopAnimation()
      },
      onPanResponderMove: (_, g) => {
        const dy = g.dy - grantDyRef.current
        if (dy < 0) return
        translateY.setValue(dy)
        const progress = Math.min(dy / (SH * 0.45), 1)
        bgOpacity.setValue(1 - progress * 0.85)
      },
      onPanResponderRelease: (_, g) => {
        const dy = g.dy - grantDyRef.current
        if (dy > DISMISS_THRESHOLD || g.vy > 1.2) {
          dismiss()
        } else {
          snapBack()
        }
      },
      onPanResponderTerminate: () => snapBack(),
      // Don't let a parent ScrollView steal the gesture mid-swipe
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
      {/* Separate fading background so it dims as you drag */}
      <Animated.View
        style={[StyleSheet.absoluteFill, s.bg, { opacity: bgOpacity }]}
        pointerEvents="none"
      />

      {/* Draggable content container */}
      <Animated.View
        style={[
          s.root,
          { paddingTop: insets.top },
          {
            transform: [{ translateY }, { scale: contentScale }],
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

        <View style={s.header}>
          <GlassContainer>
            <Pressable onPress={dismiss}>
              <GlassView
                isInteractive
                colorScheme="light"
                style={s.glassCloseBtn}
              >
                <SymbolView name="chevron.down" size={18} tintColor={colors.white} resizeMode="scaleAspectFit" />
              </GlassView>
            </Pressable>
          </GlassContainer>
          <View style={s.progressRow}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[s.seg, i <= index ? s.segFilled : s.segEmpty]}
              />
            ))}
          </View>
        </View>

        <View style={[s.bottomBar, { paddingBottom: insets.bottom + spacing[6] }]}>
          <InitialAvatar name={name} avatarUrl={photo.uploader?.avatar_url ?? null} size={28} />
          <Text style={s.uploaderName} numberOfLines={1}>{name}</Text>
          <Text style={s.counter}>{index + 1} / {photos.length}</Text>
        </View>
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
  },
  segFilled: {
    backgroundColor: colors.bone,
  },
  segEmpty: {
    backgroundColor: 'rgba(242,238,230,0.35)',
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
