import { getDrop, type DropWithParticipants } from '@/api/drops.api'
import { getDropPhotos, type PhotoWithUploader } from '@/api/photos.api'
import { subscribeToDropPhotos } from '@/api/realtime'
import { GlassCloseButton } from '@/components/ui/GlassCloseButton'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { colors } from '@/theme'
import { Image } from 'expo-image'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native'
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
})