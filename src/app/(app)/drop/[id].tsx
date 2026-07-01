import { deleteDrop, getDrop, type DropWithParticipants } from '@/api/drops.api'
import { deleteDropPhoto, getDropPhotos, pinPhoto, primeStoryCache, uploadDropPhoto, type PhotoWithUploader } from '@/api/photos.api'
import { subscribeToDropPhotos } from '@/api/realtime'
import { PhotosByUploader, PhotosByUploaderSkeleton } from '@/components/drops/PhotosByUploader'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors, spacing } from '@/theme'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { CameraIcon } from '@/components/icons/CameraIcon'
import { useCallback, useEffect, useState } from 'react'
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function sortPhotos(photos: PhotoWithUploader[]) {
  return [...photos].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.uploaded_at.localeCompare(b.uploaded_at)
  })
}

export default function DropDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const user   = useAuthStore(selectUser)
  const cached = useDropsStore(s => s.drops.find(d => d.id === id))

  const cachedPhotos = useDropsStore(s => s.photosByDrop[id ?? ''])
  const cacheDropPhotos = useDropsStore(s => s.cacheDropPhotos)

  const [drop, setDrop]                 = useState<DropWithParticipants | null>(cached ?? null)
  const [photos, setPhotos]             = useState<PhotoWithUploader[]>(cachedPhotos ?? [])
  const [photosLoaded, setPhotosLoaded] = useState(cachedPhotos != null)
  const [capturing, setCapturing]       = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!id) return
      getDrop(id).then(d => { if (d) setDrop(d) }).catch(console.error)
      getDropPhotos(id).then(p => {
        setPhotos(p)
        cacheDropPhotos(id, p)
      }).catch(console.error).finally(() => setPhotosLoaded(true))
    }, [id])
  )

  useEffect(() => {
    if (!id) return
    return subscribeToDropPhotos(id, setPhotos)
  }, [id])

  const isLocked  = drop?.state === 'active' || drop?.state === 'ready'
  const isOpen    = drop?.state === 'open' || drop?.state === 'expired'


  const canUpload = !!user && (drop?.state === 'active' || drop?.state === 'ready')
  const bottomPad = canUpload ? insets.bottom + 28 + 64 + spacing[4] : spacing[10]
  const topInset  = insets.top + 44 + spacing[4]

  async function upload(uri: string, width: number | null, height: number | null) {
    if (!id || !user) return
    setCapturing(true)
    try {
      await uploadDropPhoto(id, user.id, uri, width, height)
      const fresh = await getDropPhotos(id)
      setPhotos(fresh)
      cacheDropPhotos(id, fresh)
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

  function handleDeletePhoto(photo: PhotoWithUploader) {
    Alert.alert(
      'Delete Photo',
      'Remove this photo from the drop? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setPhotos(prev => prev.filter(p => p.id !== photo.id))
            try {
              await deleteDropPhoto(photo.id, photo.storage_path)
            } catch {
              setPhotos(prev => sortPhotos([...prev, photo]))
              Alert.alert('Delete Failed', 'Could not delete the photo. Please try again.')
            }
          },
        },
      ],
    )
  }

  async function handlePinPhoto(photo: PhotoWithUploader) {
    const next = !photo.is_pinned
    setPhotos(prev => sortPhotos(prev.map(p => p.id === photo.id ? { ...p, is_pinned: next } : p)))
    try {
      await pinPhoto(photo.id, next)
    } catch {
      setPhotos(prev => sortPhotos(prev.map(p => p.id === photo.id ? { ...p, is_pinned: !next } : p)))
      Alert.alert('Error', 'Could not update pin.')
    }
  }

  const isCreator = !!user && drop?.creator_id === user.id

  function handleMenu() {
    if (isCreator) {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: ['Cancel', 'Delete Drop'], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
          idx => { if (idx === 1) confirmDelete() },
        )
      } else {
        confirmDelete()
      }
    }
  }

  function confirmDelete() {
    Alert.alert('Delete Drop', 'This will permanently delete the drop and all its photos.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return
          try {
            await deleteDrop(id)
            useDropsStore.getState().setDrops(useDropsStore.getState().drops.filter(d => d.id !== id))
            router.back()
          } catch {
            Alert.alert('Error', 'Could not delete the drop.')
          }
        },
      },
    ])
  }

  function handlePhotoSelect(photo: PhotoWithUploader) {
    if (!isOpen) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
      Alert.alert('Drop is locked', 'Photos will be revealed when this drop opens on its scheduled date.')
      return
    }
    const idx = photos.findIndex(p => p.id === photo.id)
    primeStoryCache(photos)
    router.push({ pathname: '/drop/story', params: { dropId: id ?? '', index: String(idx >= 0 ? idx : 0) } })
  }

  return (
    <View style={s.root}>
      {!photosLoaded ? (
        <PhotosByUploaderSkeleton topInset={topInset} />
      ) : (
        <PhotosByUploader
          photos={photos}
          thumbnailUrl={drop?.thumbnail_url}
          creatorName={drop?.creator?.display_name ?? drop?.creator?.username}
          creatorAvatarUrl={drop?.creator?.avatar_url}
          createdAt={drop?.created_at}
          onSelect={handlePhotoSelect}
          onDelete={handleDeletePhoto}
          onPin={handlePinPhoto}
          bottomPad={bottomPad}
          isLocked={isLocked}
          currentUserId={user?.id}
          emptyMessage={
            isLocked && canUpload
              ? 'Be the first to add a photo using the camera below.'
              : isLocked
              ? "Participants haven't uploaded anything yet."
              : 'No photos were uploaded before this drop closed.'
          }
        />
      )}

      {/* Custom header */}
      <View style={[s.header, { paddingTop: insets.top }]} pointerEvents="box-none">
        <GlassIconButton onPress={() => router.back()}>
          <SymbolView name="chevron.left" size={18} tintColor={colors.white} weight="semibold" resizeMode="scaleAspectFit" />
        </GlassIconButton>
        <View style={s.headerSpacer} />
        {isCreator && (
          <GlassIconButton onPress={handleMenu}>
            <SymbolView name="ellipsis" size={18} tintColor={colors.white} weight="semibold" resizeMode="scaleAspectFit" />
          </GlassIconButton>
        )}
      </View>

      {canUpload && (
        <View style={[s.captureWrap, { bottom: insets.bottom + 28 }]} pointerEvents="box-none">
          {__DEV__ && (
            <TouchableOpacity
              style={s.devPickBtn}
              onPress={handleDevPick}
              disabled={capturing}
              activeOpacity={0.8}
            >
              <SymbolView name="photo" size={18} tintColor={colors.bone} weight="semibold" resizeMode="scaleAspectFit" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleCapture} disabled={capturing} style={s.glassCaptureBtn} activeOpacity={0.85}>
            {capturing ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <CameraIcon size={28} color={colors.ink} />
            )}
          </TouchableOpacity>
        </View>
      )}

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[2],
    gap: spacing[2],
    zIndex: 10,
  },
  headerSpacer: {
    flex: 1,
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },


  captureWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 20,
  },
  devPickBtn: {
    position: 'absolute',
    left: spacing[4],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242,238,230,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,238,230,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCaptureBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
})
