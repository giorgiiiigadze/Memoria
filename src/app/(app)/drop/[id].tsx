import { getDrop } from '@/api/drops.api'
import { useDropsStore } from '@/store/drops.store'
import type { DropState } from '@/types/database.types'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { DropWithParticipants } from '@/api/drops.api'

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
  const cached = useDropsStore(s => s.drops.find(d => d.id === id))
  const [drop, setDrop] = useState<DropWithParticipants | null>(cached ?? null)

  useEffect(() => {
    if (!cached && id) {
      getDrop(id).then(d => { if (d) setDrop(d) }).catch(console.error)
    }
  }, [id])

  if (!drop) return <View style={s.root} />

  const meta = STATE_META[drop.state]
  const participantCount = drop.participants?.length ?? 0

  return (
    <View style={s.root}>
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
    </View>
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
  root: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 },
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
  actionBtn: { marginTop: 32, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  actionBtnLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
})
