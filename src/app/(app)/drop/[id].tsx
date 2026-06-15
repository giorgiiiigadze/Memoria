import { getDrop, type DropWithParticipants } from '@/api/drops.api'
import { getDropPhotos, uploadDropPhoto, type PhotoWithUploader } from '@/api/photos.api'
import { subscribeToDropPhotos } from '@/api/realtime'
import { GlassBackButton } from '@/components/ui/GlassBackButton'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors } from '@/theme'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Camera, Image as ImageIcon } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { height: SH } = Dimensions.get('window')

const BOTTOM_PEEK = 70
const GAP = 12
const CARD_HEIGHT = SH - BOTTOM_PEEK
const SNAP = CARD_HEIGHT + GAP
const BORDER_RADIUS = 20

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

  return (
    <View style={s.root}>
      <StatusBar hidden />
      
      <View style={[s.header, { top: insets.top }]}>
        <GlassBackButton onPress={() => router.back()} />
        <Text style={s.headerTitle}>{drop?.title ?? 'Drop'}</Text>
        <View style={s.headerSpacer} />
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
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
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