import { getDrop, type DropWithParticipants } from '@/api/drops.api'
import { getDropPhotos, uploadDropPhoto, type PhotoWithUploader } from '@/api/photos.api'
import { subscribeToDropPhotos } from '@/api/realtime'
import { PhotoGrid } from '@/components/drops/PhotoGrid'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors } from '@/theme'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { Camera, Image as ImageIcon } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

const { width: SW } = Dimensions.get('window')

function SkeletonGrid({ topInset }: { topInset: number }) {
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

  const COLS = 2
  const GAP = 4
  const tileSize = Math.floor((SW - GAP * (COLS - 1)) / COLS)
  const tileHeight = Math.floor(tileSize * (4 / 3))

  return (
    <View style={[s.skeletonGrid, { paddingTop: topInset }]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[s.skeletonTile, { width: tileSize, height: tileHeight }]}>
          <Animated.View style={[s.shimmerBar, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.04)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      ))}
    </View>
  )
}

export default function DropDetailScreen() {
  const { id, backTitle } = useLocalSearchParams<{ id: string; backTitle?: string }>()
  const insets  = useSafeAreaInsets()
  const user    = useAuthStore(selectUser)
  const cached  = useDropsStore(s => s.drops.find(d => d.id === id))

  const [drop, setDrop]                 = useState<DropWithParticipants | null>(cached ?? null)
  const [photos, setPhotos]             = useState<PhotoWithUploader[]>([])
  const [photosLoaded, setPhotosLoaded] = useState(false)
  const [capturing, setCapturing]       = useState(false)
  const [refreshing, setRefreshing]     = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!id) return
      getDrop(id).then(d => { if (d) setDrop(d) }).catch(console.error)
      getDropPhotos(id).then(p => setPhotos(p)).catch(console.error).finally(() => setPhotosLoaded(true))
    }, [id])
  )

  useEffect(() => {
    if (!id) return
    return subscribeToDropPhotos(id, setPhotos)
  }, [id])

  const visiblePhotos = photos
  const isLocked = drop?.state === 'active' || drop?.state === 'ready'

  const canUpload = !!user && (drop?.state === 'active' || drop?.state === 'ready')

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
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

  const topInset = insets.top + 44 + 12

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerTitle: drop?.title ?? cached?.title ?? '' }} />

      {!photosLoaded ? (
        <SkeletonGrid topInset={topInset} />
      ) : visiblePhotos.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>No photos yet</Text>
        </View>
      ) : (
        <PhotoGrid
          photos={visiblePhotos}
          onSelect={() => {}}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          topInset={topInset}
          isLocked={isLocked}
          currentUserId={user?.id}
        />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent']}
        style={s.topScrim}
        pointerEvents="none"
      />

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


  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 5,
  },

  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skeletonTile: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
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
