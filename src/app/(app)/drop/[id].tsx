import { getDrop, type DropWithParticipants } from '@/api/drops.api'
import { getDropPhotos, uploadDropPhoto, type PhotoWithUploader } from '@/api/photos.api'
import { subscribeToDropPhotos } from '@/api/realtime'
import { DropDetailHeader } from '@/components/drops/DropDetailHeader'
import { InitialAvatar } from '@/components/ui/InitialAvatar'
import { CARD_RADIUS } from '@/constants/drops'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors } from '@/theme'
import { formatDate } from '@/utils/date'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Camera, Image as ImageIcon } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SW, height: SH } = Dimensions.get('window')

const BOTTOM_PEEK   = 70
const GAP           = 12
const CARD_HEIGHT   = SH - BOTTOM_PEEK
const SNAP          = CARD_HEIGHT + GAP
const BORDER_RADIUS = CARD_RADIUS * 1.5

// ── Loading skeleton ──────────────────────────────────────────────────────────

function SkeletonCard() {
  const shimmerX = useSharedValue(0)

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    )
    return () => cancelAnimation(shimmerX)
  }, [])

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerX.value, [0, 1], [-SW, SW]) }],
  }))

  return (
    <View style={[s.card, s.skeleton]}>
      <Animated.View style={[s.shimmerBar, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.04)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )
}

// ── Photo card ────────────────────────────────────────────────────────────────

function PhotoCard({ item }: { item: PhotoWithUploader }) {
  const name = item.uploader?.display_name ?? item.uploader?.username ?? 'Unknown'
  return (
    <View style={s.card}>
      <Image
        source={{ uri: item.cdn_url }}
        style={s.image}
        contentFit="cover"
        transition={300}
        placeholderContentFit="cover"
        recyclingKey={item.id}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={s.uploaderRow}
      >
        <InitialAvatar name={name} avatarUrl={item.uploader?.avatar_url ?? null} size={36} />
        <View>
          <Text style={s.uploaderName} numberOfLines={1}>{name}</Text>
          {formatDate(item.uploaded_at) && (
            <Text style={s.uploaderDate}>{formatDate(item.uploaded_at)}</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DropDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>()
  const insets   = useSafeAreaInsets()
  const user     = useAuthStore(selectUser)
  const cached   = useDropsStore(s => s.drops.find(d => d.id === id))
  const [drop, setDrop]           = useState<DropWithParticipants | null>(cached ?? null)
  const [photos, setPhotos]       = useState<PhotoWithUploader[]>([])
  const [photosLoaded, setPhotosLoaded] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!id) return
      getDrop(id).then(d => { if (d) setDrop(d) }).catch(console.error)
      getDropPhotos(id).then(p => { setPhotos(p); setPhotosLoaded(true) }).catch(console.error)
    }, [id])
  )

  useEffect(() => {
    if (!id) return
    return subscribeToDropPhotos(id, setPhotos)
  }, [id])

  // ── Haptics on snap ───────────────────────────────────────────────────────
  const lastSnapIndex = useRef<number | null>(null)

  function handleMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / SNAP)
    if (lastSnapIndex.current === null) {
      lastSnapIndex.current = idx
      return
    }
    if (idx !== lastSnapIndex.current) {
      lastSnapIndex.current = idx
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const visiblePhotos =
    drop && (drop.state === 'active' || drop.state === 'ready')
      ? photos.filter(p => p.uploader_id === user?.id)
      : photos

  const canUpload = !!user && (drop?.state === 'active' || drop?.state === 'ready')

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  async function handleRefresh() {
    if (!id) return
    try {
      setRefreshing(true)
      const [d, p] = await Promise.all([getDrop(id), getDropPhotos(id)])
      if (d) setDrop(d)
      setPhotos(p)
    } catch (e) {
      console.error('[drop/refresh]', e)
    } finally {
      setRefreshing(false)
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  async function upload(uri: string, width: number | null, height: number | null) {
    if (!id || !user) return
    setCapturing(true)
    try {
      await uploadDropPhoto(id, user.id, uri, width, height)
      const fresh = await getDropPhotos(id)
      setPhotos(fresh)
    } catch (e) {
      console.error('[capture] upload failed:', e)
      Alert.alert('Upload failed', 'Could not upload your photo. Please try again.')
    } finally {
      setCapturing(false)
    }
  }

  async function handleCapture() {
    if (!id || !user || capturing) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Enable camera access in Settings to add a photo to this drop.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (result.canceled) return
    const a = result.assets[0]
    await upload(a.uri, a.width ?? null, a.height ?? null)
  }

  async function handleDevPick() {
    if (!id || !user || capturing) return
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 })
    if (result.canceled) return
    const a = result.assets[0]
    await upload(a.uri, a.width ?? null, a.height ?? null)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar hidden />

      {/* Top scrim: keeps back button + title readable over bright photos */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={s.topScrim}
        pointerEvents="none"
      />

      <DropDetailHeader title={drop?.title ?? 'Drop'} />

      {!photosLoaded ? (
        <SkeletonCard />
      ) : visiblePhotos.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>No photos yet</Text>
        </View>
      ) : (
        <FlatList
          data={visiblePhotos}
          keyExtractor={p => p.id}
          showsVerticalScrollIndicator={false}
          snapToInterval={SNAP}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: SNAP, offset: SNAP * index, index })}
          contentContainerStyle={s.content}
          renderItem={({ item }) => <PhotoCard item={item} />}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.bone}
              colors={[colors.bone]}
            />
          }
        />
      )}

      {canUpload && (
        <View style={[s.captureWrap, { bottom: insets.bottom + 28 }]} pointerEvents="box-none">
          {__DEV__ && (
            <TouchableOpacity
              style={s.devPickBtn}
              onPress={handleDevPick}
              disabled={capturing}
              activeOpacity={0.8}
            >
              <ImageIcon size={18} color={colors.bone} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.captureBtn}
            onPress={handleCapture}
            disabled={capturing}
            activeOpacity={0.85}
          >
            {capturing ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Camera size={28} color={colors.ink} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {},

  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 5,
  },

  card: {
    height: CARD_HEIGHT,
    marginBottom: GAP,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.surfaceInput,
  },
  image: { flex: 1 },
  uploaderRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 60,
  },
  uploaderName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  uploaderDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },

  skeleton: {
    backgroundColor: colors.surface,
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SW * 0.5,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textTertiary, fontSize: 15 },

  captureWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 20,
  },
  devPickBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242,238,230,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,238,230,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(242, 238, 230, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
})
