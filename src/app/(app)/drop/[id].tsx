    import { getDrop, type DropWithParticipants } from '@/api/drops.api'
import { getDropPhotos, uploadDropPhoto, type PhotoWithUploader } from '@/api/photos.api'
import { subscribeToDropPhotos } from '@/api/realtime'
import { GlassCloseButton } from '@/components/ui/GlassCloseButton'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors } from '@/theme'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Camera } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { height: SH } = Dimensions.get('window')

const PEEK = 52
const GAP = 14
const CARD_HEIGHT = SH - 2 * (PEEK + GAP)
const SNAP = CARD_HEIGHT + GAP
const BORDER_RADIUS = 50

function PhotoCard({ item }: { item: PhotoWithUploader }) {
  return (
    <View style={s.card}>
      <Image source={{ uri: item.cdn_url }} style={s.image} contentFit="cover" />
    </View>
  )
}

export default function DropDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const user = useAuthStore(selectUser)
  const cached = useDropsStore(s => s.drops.find(d => d.id === id))
  const [drop, setDrop] = useState<DropWithParticipants | null>(cached ?? null)
  const [photos, setPhotos] = useState<PhotoWithUploader[]>([])
  const [capturing, setCapturing] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!id) return
      getDrop(id).then(d => { if (d) setDrop(d) }).catch(console.error)
      getDropPhotos(id).then(setPhotos).catch(console.error)
    }, [id])
  )

  useEffect(() => {
    if (!id) return
    return subscribeToDropPhotos(id, setPhotos)
  }, [id])

  const visiblePhotos =
    drop && (drop.state === 'active' || drop.state === 'ready')
      ? photos.filter(p => p.uploader_id === user?.id)
      : photos

  const canUpload = !!user && (drop?.state === 'active' || drop?.state === 'ready')

  async function handleCapture() {
    if (!id || !user || capturing) return
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Enable camera access to add a photo to this drop.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (result.canceled) return
    const a = result.assets[0]
    setCapturing(true)
    try {
      await uploadDropPhoto(id, user.id, a.uri, a.width ?? null, a.height ?? null)
      const fresh = await getDropPhotos(id)
      setPhotos(fresh)
    } catch (e) {
      console.error('[capture] upload failed:', e)
      Alert.alert('Upload failed', 'Could not upload your photo. Please try again.')
    } finally {
      setCapturing(false)
    }
  }

  return (
    <View style={s.root}>
      <StatusBar hidden />
      
      <View style={[s.closeBtn, { top: insets.top + 8 }]}>
        <GlassCloseButton onPress={() => router.back()} />
      </View>
    
      {visiblePhotos.length === 0 ? (
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
        />
      )}

      {canUpload && (
        <View style={[s.captureWrap, { bottom: insets.bottom + 28 }]} pointerEvents="box-none">
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
  content: { paddingVertical: PEEK + GAP },
  card: {
    height: CARD_HEIGHT,
    marginBottom: GAP,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.surfaceInput,
  },
  image: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textTertiary, fontSize: 15 },
  closeBtn: {
    position: 'absolute',
    left: 10,
    zIndex: 10,
  },
  captureWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
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