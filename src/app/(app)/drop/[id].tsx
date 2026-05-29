import { getDrop, type DropWithParticipants } from '@/api/drops.api'
import { getDropPhotos, type PhotoWithUploader } from '@/api/photos.api'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import type { DropState } from '@/types/database.types'
import { Image } from 'expo-image'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const COLS = 3
const GAP = 2
const H_PAD = 24
const { width: SW, height: SH } = Dimensions.get('window')
const THUMB = (SW - H_PAD * 2 - GAP * (COLS - 1)) / COLS

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function formatDate(iso: string | null) {
  if (!iso) return 'No open date'
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const STATE_META: Record<DropState, { label: string; color: string }> = {
  active:  { label: 'Active',   color: '#0044FF' },
  ready:   { label: 'Ready',    color: '#4CAF7D' },
  open:    { label: 'Open',     color: '#F59E0B' },
  expired: { label: 'Expired',  color: '#626262' },
}

export default function DropDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useAuthStore(selectUser)
  const cached = useDropsStore(s => s.drops.find(d => d.id === id))
  const [drop, setDrop] = useState<DropWithParticipants | null>(cached ?? null)
  const [photos, setPhotos] = useState<PhotoWithUploader[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!cached && id) {
      getDrop(id).then(d => { if (d) setDrop(d) }).catch(console.error)
    }
  }, [id])

  useFocusEffect(
    useCallback(() => {
      if (!id) return
      getDrop(id).then(d => { if (d) setDrop(d) }).catch(console.error)
      getDropPhotos(id).then(setPhotos).catch(console.error)
    }, [id])
  )

  if (!drop) return <View style={s.root} />

  const meta = STATE_META[drop.state]
  const participantCount = drop.participants?.length ?? 0

  // On active/ready drops, only show the current user's own photos
  const visiblePhotos = (drop.state === 'active' || drop.state === 'ready')
    ? photos.filter(p => p.uploader_id === user?.id)
    : photos

  const photoSectionTitle = drop.state === 'open' || drop.state === 'expired'
    ? `Photos  ${photos.length > 0 ? photos.length : ''}`
    : `Your Photos  ${visiblePhotos.length > 0 ? visiblePhotos.length : ''}`

  // Build rows for the grid (avoid nested FlatList inside ScrollView)
  const rows: PhotoWithUploader[][] = []
  for (let i = 0; i < visiblePhotos.length; i += COLS) {
    rows.push(visiblePhotos.slice(i, i + COLS))
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Text style={s.backLabel}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.title} numberOfLines={2}>{drop.title}</Text>

      <View style={[s.badge, { borderColor: meta.color }]}>
        <Text style={[s.badgeLabel, { color: meta.color }]}>{meta.label}</Text>
      </View>

      <View style={s.rows}>
        <InfoRow label="Opens" value={formatDate(drop.open_date)} />
        <InfoRow label="Participants" value={String(participantCount)} />
      </View>

      {/* Action buttons */}
      {(drop.state === 'active' || drop.state === 'ready') && (
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: '#0044FF' }]}
          onPress={() => router.push({ pathname: '/drop/upload', params: { id: drop.id } } as any)}
          activeOpacity={0.8}
        >
          <Text style={s.actionBtnLabel}>Upload Photos</Text>
        </TouchableOpacity>
      )}
      {drop.state === 'open' && (
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: '#F59E0B' }]}
          onPress={() => router.push({ pathname: '/drop/gallery', params: { id: drop.id } } as any)}
          activeOpacity={0.8}
        >
          <Text style={s.actionBtnLabel}>View Gallery</Text>
        </TouchableOpacity>
      )}

      {/* Photo section */}
      {visiblePhotos.length > 0 && (
        <View style={s.photoSection}>
          <Text style={s.photoSectionTitle}>{photoSectionTitle}</Text>
          <View style={s.grid}>
            {rows.map((row, ri) => (
              <View key={ri} style={s.gridRow}>
                {row.map((photo, ci) => (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={() => setLightboxIndex(ri * COLS + ci)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: photo.cdn_url }}
                      style={s.thumb}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ))}
                {/* Fill empty slots in last row */}
                {Array.from({ length: COLS - row.length }).map((_, i) => (
                  <View key={`gap-${i}`} style={s.thumbGap} />
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty state for active/ready with no uploads yet */}
      {visiblePhotos.length === 0 && (drop.state === 'active' || drop.state === 'ready') && (
        <View style={s.emptyPhotos}>
          <Text style={s.emptyPhotosText}>You haven't uploaded any photos yet.</Text>
        </View>
      )}

      {/* Lightbox */}
      <Modal visible={lightboxIndex !== null} animationType="fade" statusBarTranslucent>
        <View style={s.modalRoot}>
          <TouchableOpacity style={s.closeBtn} onPress={() => setLightboxIndex(null)}>
            <Text style={s.closeBtnLabel}>✕</Text>
          </TouchableOpacity>
          {lightboxIndex !== null && (
            <FlatList
              data={visiblePhotos}
              horizontal
              pagingEnabled
              initialScrollIndex={lightboxIndex}
              getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={s.modalPage}>
                  <Image
                    source={{ uri: item.cdn_url }}
                    style={s.modalImg}
                    contentFit="contain"
                  />
                  {item.uploader && (
                    <Text style={s.modalUploader}>
                      @{item.uploader.username}
                      {item.uploader.display_name ? `  ·  ${item.uploader.display_name}` : ''}
                    </Text>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: H_PAD, paddingTop: 72, paddingBottom: 48 },
  back: { marginBottom: 24 },
  backLabel: { fontSize: 15, color: '#898989' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 12 },
  badge: { borderWidth: 0.5, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 28 },
  badgeLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  rows: { gap: 0 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#252525',
  },
  infoLabel: { fontSize: 14, color: '#626262' },
  infoValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },
  actionBtn: { marginTop: 24, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  actionBtnLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  photoSection: { marginTop: 32 },
  photoSectionTitle: { fontSize: 13, fontWeight: '600', color: '#626262', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  grid: { gap: GAP },
  gridRow: { flexDirection: 'row', gap: GAP },
  thumb: { width: THUMB, height: THUMB, borderRadius: 4, backgroundColor: '#191919' },
  thumbGap: { width: THUMB },
  emptyPhotos: { marginTop: 28, alignItems: 'center' },
  emptyPhotosText: { fontSize: 13, color: '#626262' },
  // Lightbox
  modalRoot: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute', top: 56, right: 20, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnLabel: { fontSize: 16, color: '#FFFFFF' },
  modalPage: { width: SW, height: SH, alignItems: 'center', justifyContent: 'center' },
  modalImg: { width: SW, height: SH * 0.75 },
  modalUploader: { position: 'absolute', bottom: 80, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
})
