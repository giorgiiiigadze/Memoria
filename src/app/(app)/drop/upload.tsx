import { uploadDropPhoto } from '@/api/photos.api'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const COLS = 3
const GAP = 2
const CELL_SIZE = (Dimensions.get('window').width - GAP * (COLS + 1)) / COLS
const MAX_PHOTOS = 10

type PickedPhoto = {
  uri: string
  width: number | null
  height: number | null
  status: 'pending' | 'uploading' | 'done' | 'error'
}

export default function UploadScreen() {
  const { id: dropId } = useLocalSearchParams<{ id: string }>()
  const user = useAuthStore(selectUser)
  const [photos, setPhotos] = useState<PickedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateStatus(index: number, status: PickedPhoto['status']) {
    setPhotos(prev => prev.map((p, i) => (i === index ? { ...p, status } : p)))
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_PHOTOS,
    })
    if (!result.canceled) {
      const picked: PickedPhoto[] = result.assets.map(a => ({
        uri: a.uri,
        width: a.width ?? null,
        height: a.height ?? null,
        status: 'pending',
      }))
      setPhotos(prev => [...prev, ...picked].slice(0, MAX_PHOTOS))
    }
  }

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (!result.canceled) {
      const a = result.assets[0]
      setPhotos(prev =>
        [...prev, { uri: a.uri, width: a.width ?? null, height: a.height ?? null, status: 'pending' as const }].slice(
          0,
          MAX_PHOTOS
        )
      )
    }
  }

  function remove(uri: string) {
    setPhotos(prev => prev.filter(p => p.uri !== uri))
  }

  async function handleUpload() {
    if (!dropId || !user || photos.length === 0) return
    setUploading(true)
    setError(null)

    let anyError = false
    for (let i = 0; i < photos.length; i++) {
      if (photos[i].status === 'done') continue
      updateStatus(i, 'uploading')
      try {
        await uploadDropPhoto(dropId, user.id, photos[i].uri, photos[i].width, photos[i].height)
        updateStatus(i, 'done')
      } catch (e) {
        console.error('[upload] photo failed:', e)
        updateStatus(i, 'error')
        anyError = true
      }
    }

    setUploading(false)
    if (!anyError) {
      router.back()
    } else {
      setError('Some photos failed. Tap Upload to retry.')
    }
  }

  const hasPending = photos.some(p => p.status === 'pending' || p.status === 'error')
  const canUpload = hasPending && !uploading

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={uploading}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Add Photos</Text>
        <View style={{ width: 60 }} />
      </View>

      {photos.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No photos selected</Text>
          <Text style={s.emptySub}>Pick from your camera roll or take a new one.</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={COLS}
          keyExtractor={item => item.uri}
          style={s.grid}
          contentContainerStyle={{ padding: GAP }}
          renderItem={({ item, index }) => (
            <View style={s.cell}>
              <Image source={{ uri: item.uri }} style={s.cellImg} contentFit="cover" />
              {item.status === 'uploading' && (
                <View style={s.overlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
              {item.status === 'done' && (
                <View style={[s.overlay, s.overlayDone]}>
                  <Text style={s.overlayIcon}>✓</Text>
                </View>
              )}
              {item.status === 'error' && (
                <View style={[s.overlay, s.overlayError]}>
                  <Text style={s.overlayIcon}>!</Text>
                </View>
              )}
              {item.status === 'pending' && !uploading && (
                <TouchableOpacity style={s.removeBtn} onPress={() => remove(item.uri)}>
                  <Text style={s.removeBtnLabel}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {error ? <Text style={s.errorText}>{error}</Text> : null}

      <View style={s.footer}>
        <TouchableOpacity style={s.btnSecondary} onPress={pickFromLibrary} disabled={uploading}>
          <Text style={s.btnSecondaryLabel}>Camera Roll</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={takePhoto} disabled={uploading}>
          <Text style={s.btnSecondaryLabel}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnPrimary, !canUpload && s.btnDisabled]}
          onPress={handleUpload}
          disabled={!canUpload}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.btnPrimaryLabel}>
              Upload{photos.length > 0 ? ` (${photos.filter(p => p.status !== 'done').length})` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 16,
  },
  back: { fontSize: 15, color: '#898989' },
  title: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '500', color: '#FFFFFF', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#626262', textAlign: 'center', lineHeight: 20 },
  grid: { flex: 1 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: GAP,
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  cellImg: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayDone: { backgroundColor: 'rgba(76,175,125,0.55)' },
  overlayError: { backgroundColor: 'rgba(234,73,66,0.55)' },
  overlayIcon: { fontSize: 22, color: '#FFFFFF', fontWeight: '700' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnLabel: { fontSize: 16, color: '#FFFFFF', lineHeight: 22 },
  errorText: { fontSize: 13, color: '#EA4942', textAlign: 'center', paddingHorizontal: 24, paddingBottom: 8 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#252525',
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    alignItems: 'center',
  },
  btnSecondaryLabel: { fontSize: 13, color: '#C4C4C4', fontWeight: '500' },
  btnPrimary: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0044FF',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryLabel: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
})
