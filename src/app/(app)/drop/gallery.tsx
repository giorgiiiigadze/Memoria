import { getDrop } from '@/api/drops.api'
import { getDropPhotos, type PhotoWithUploader } from '@/api/photos.api'
import type { DropWithParticipants } from '@/api/drops.api'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const COLS = 2
const GAP = 2
const { width: SW, height: SH } = Dimensions.get('window')
const CELL_SIZE = (SW - GAP * (COLS + 1)) / COLS

export default function GalleryScreen() {
  const { id: dropId } = useLocalSearchParams<{ id: string }>()
  const [drop, setDrop] = useState<DropWithParticipants | null>(null)
  const [photos, setPhotos] = useState<PhotoWithUploader[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!dropId) return
    Promise.all([getDrop(dropId), getDropPhotos(dropId)])
      .then(([d, p]) => { setDrop(d); setPhotos(p) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dropId])

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    )
  }

  if (drop && drop.state !== 'open') {
    return (
      <View style={s.root}>
        <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <View style={s.centered}>
          <Text style={s.lockedTitle}>Not open yet</Text>
          <Text style={s.lockedSub}>Photos will be revealed on{drop.open_date ? ` ${fmtDate(drop.open_date)}` : ' the open date'}.</Text>
        </View>
      </View>
    )
  }

  if (photos.length === 0) {
    return (
      <View style={s.root}>
        <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <View style={s.centered}>
          <Text style={s.lockedTitle}>No photos yet</Text>
          <Text style={s.lockedSub}>No one has uploaded to this drop.</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>{drop?.title ?? 'Gallery'}</Text>
        <Text style={s.count}>{photos.length}</Text>
      </View>

      <FlatList
        data={photos}
        numColumns={COLS}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: GAP }}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={s.cell} onPress={() => setLightboxIndex(index)} activeOpacity={0.85}>
            <Image source={{ uri: item.cdn_url }} style={s.cellImg} contentFit="cover" />
            <View style={s.cellFooter}>
              <Text style={s.uploaderLabel} numberOfLines={1}>
                @{item.uploader?.username ?? '?'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={lightboxIndex !== null} animationType="fade" statusBarTranslucent>
        <View style={s.modalRoot}>
          <TouchableOpacity style={s.closeBtn} onPress={() => setLightboxIndex(null)}>
            <Text style={s.closeBtnLabel}>✕</Text>
          </TouchableOpacity>
          {lightboxIndex !== null && (
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              initialScrollIndex={lightboxIndex}
              getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={s.modalPage}>
                  <Image source={{ uri: item.cdn_url }} style={s.modalImg} contentFit="contain" />
                  <View style={s.modalMeta}>
                    <Text style={s.modalUploader}>
                      @{item.uploader?.username ?? '?'}
                      {item.uploader?.display_name ? `  ·  ${item.uploader.display_name}` : ''}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  centered: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', padding: 40 },
  backRow: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 16 },
  back: { fontSize: 15, color: '#898989' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 16,
  },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: '#FFFFFF', marginHorizontal: 12, textAlign: 'center' },
  count: { fontSize: 13, color: '#626262', minWidth: 24, textAlign: 'right' },
  lockedTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 },
  lockedSub: { fontSize: 14, color: '#626262', textAlign: 'center', lineHeight: 20 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE + 28,
    margin: GAP,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#191919',
  },
  cellImg: { width: '100%', height: CELL_SIZE },
  cellFooter: { paddingHorizontal: 6, paddingVertical: 5 },
  uploaderLabel: { fontSize: 11, color: '#898989' },
  modalRoot: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnLabel: { fontSize: 16, color: '#FFFFFF' },
  modalPage: { width: SW, height: SH, alignItems: 'center', justifyContent: 'center' },
  modalImg: { width: SW, height: SH * 0.75 },
  modalMeta: { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center' },
  modalUploader: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
})
