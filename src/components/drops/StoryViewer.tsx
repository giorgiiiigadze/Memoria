import type { PhotoWithUploader } from '@/api/photos.api'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { colors, radii, spacing } from '@/theme'
import { timeAgo } from '@/utils/date'
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
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SW = Dimensions.get('window').width
const SH = Dimensions.get('window').height
const DISMISS_THRESHOLD = 50

const THUMB_W        = 60
const THUMB_H        = 80
const THUMB_ACTIVE_W = 94
const THUMB_ACTIVE_H = 125
const THUMB_MARGIN   = 0
const THUMB_ITEM_W   = THUMB_W + 2 * THUMB_MARGIN
const FILMSTRIP_H    = 96
const FILMSTRIP_PAD  = SW / 2 - THUMB_W / 2
const HEADER_H           = 52

function FilmstripThumb({
  item,
  isActive,
  onPress,
}: {
  item: PhotoWithUploader
  isActive: boolean
  onPress: () => void
}) {
  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: false,
      tension: 220,
      friction: 22,
    }).start()
  }, [isActive])

  const width   = anim.interpolate({ inputRange: [0, 1], outputRange: [THUMB_W, THUMB_ACTIVE_W] })
  const height  = anim.interpolate({ inputRange: [0, 1], outputRange: [THUMB_H, THUMB_ACTIVE_H] })
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] })
  const radius  = anim.interpolate({ inputRange: [0, 1], outputRange: [7, 10] })

  return (
    <Animated.View style={[ft.slot, { width, height, opacity }]}>
      <Pressable onPress={onPress} style={StyleSheet.absoluteFill}>
        <Animated.View style={[ft.border, isActive && ft.borderActive, { borderRadius: radius }]}>
          <Animated.View style={[ft.clip, { borderRadius: anim.interpolate({ inputRange: [0, 1], outputRange: [4.5, 7.5] }) }]}>
            <Image source={{ uri: item.cdn_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

const ft = StyleSheet.create({
  slot: { marginHorizontal: THUMB_MARGIN },
  border: {
    flex: 1,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  borderActive: {
    borderColor: '#000',
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
})

type Props = {
  photos: PhotoWithUploader[]
  initialIndex: number
  visible: boolean
  onClose: () => void
}

export function StoryViewer({ photos, initialIndex, visible, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(initialIndex)

  const onCloseRef        = useRef(onClose)
  const filmstripTranslate = useRef(new Animated.Value(0)).current
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
    filmstripTranslate.setValue(-(initialIndex * THUMB_ITEM_W) - (THUMB_ACTIVE_W - THUMB_W) / 2 - THUMB_MARGIN)
    setIndex(initialIndex)
  }, [visible, initialIndex])


  useEffect(() => {
    Animated.spring(filmstripTranslate, {
      toValue: -(index * THUMB_ITEM_W) - (THUMB_ACTIVE_W - THUMB_W) / 2 - THUMB_MARGIN,
      useNativeDriver: true,
      tension: 220,
      friction: 24,
    }).start()
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

      {/* Photo card — translates + scales during drag-to-dismiss */}
      <Animated.View
        style={[
          s.root,
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
          style={[s.photo, { top: insets.top + HEADER_H, bottom: photoBottom }]}
          contentFit="cover"
          contentPosition="center"
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={[s.bottomGradient, { bottom: photoBottom }]}
          pointerEvents="none"
        />

        <Pressable
          style={[StyleSheet.absoluteFill, { top: insets.top + HEADER_H, bottom: photoBottom }]}
          onPress={e => handleTap(e.nativeEvent.locationX)}
        />
      </Animated.View>

      {/* Header — fixed, doesn't move with the card */}
      <Animated.View
        style={[s.header, { paddingTop: insets.top, opacity: overlayOpacity }]}
        pointerEvents="box-none"
      >
        <InitialAvatar name={name} avatarUrl={photo.uploader?.avatar_url ?? null} size={32} />

        <View style={s.headerMeta}>
          <Text style={s.headerName} numberOfLines={1}>{name}</Text>
          <Text style={s.headerDate} numberOfLines={1}>{timeAgo(photo.uploaded_at)}</Text>
        </View>

        <View style={s.headerSpacer} />

        <GlassContainer>
          <Pressable onPress={() => dismiss()}>
            <GlassView isInteractive colorScheme="light" style={s.glassCloseBtn}>
              <SymbolView name="chevron.down" size={18} tintColor={colors.white} resizeMode="scaleAspectFit" />
            </GlassView>
          </Pressable>
        </GlassContainer>
      </Animated.View>

      {/* Filmstrip — fixed, doesn't move with the card */}
      <Animated.View
        style={[s.filmstrip, { paddingBottom: insets.bottom + spacing[3], opacity: overlayOpacity }]}
        pointerEvents="box-none"
      >
        <View style={s.filmstripTrack}>
          <Animated.View
            style={[s.filmstripContent, { transform: [{ translateX: filmstripTranslate }] }]}
          >
            {photos.map((item, i) => (
              <FilmstripThumb
                key={i}
                item={item}
                isActive={i === index}
                onPress={() => setIndex(i)}
              />
            ))}
          </Animated.View>

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
    backgroundColor: 'transparent',
  },
  photo: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radii.lg,
    overflow: 'hidden',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerMeta: {
    flexShrink: 1,
    gap: 2,
  },
  headerName: {
    color: colors.bone,
    fontSize: 14,
    fontWeight: '600',
  },
  headerDate: {
    color: 'rgba(242,238,230,0.6)',
    fontSize: 12,
  },
  headerSpacer: {
    flex: 1,
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
    paddingTop: spacing[1],
    overflow: 'visible',
  },
  filmstripTrack: {
    overflow: 'visible',
  },
  filmstripContent: {
    flexDirection: 'row',
    paddingHorizontal: FILMSTRIP_PAD,
    alignItems: 'flex-end',
    overflow: 'visible',
  },
})
