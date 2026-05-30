import type { DropWithParticipants } from '@/api/drops.api'
import type { DropState } from '@/types/database.types'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatOpenDate(iso: string | null): string {
  if (!iso) return 'No open date'
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export const STATE_META: Record<DropState, { label: string; color: string }> = {
  active:  { label: 'Active',   color: '#0044FF' },
  ready:   { label: 'Ready',    color: '#4CAF7D' },
  open:    { label: 'Open',     color: '#F59E0B' },
  expired: { label: 'Expired',  color: '#626262' },
}

export function DropCard({ drop, showCreator = false }: { drop: DropWithParticipants; showCreator?: boolean }) {
  const meta = STATE_META[drop.state]
  const participantCount = drop.participants?.length ?? 0
  const creatorName = drop.creator?.display_name ?? drop.creator?.username ?? null

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push({ pathname: `/drop/${drop.id}`, params: { from: '/(app)/(home)' } } as any)}
      activeOpacity={0.75}
    >
      {drop.thumbnail_url && (
        <Image source={{ uri: drop.thumbnail_url }} style={s.cardThumb} contentFit="cover" />
      )}
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={s.cardTitle} numberOfLines={1}>{drop.title}</Text>
          <View style={[s.badge, { borderColor: meta.color }]}>
            <Text style={[s.badgeLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <View style={s.cardBottom}>
          <Text style={s.cardMeta}>{formatOpenDate(drop.open_date)}</Text>
          {participantCount > 0 && (
            <Text style={s.cardMeta}>{participantCount} participant{participantCount !== 1 ? 's' : ''}</Text>
          )}
          {showCreator && creatorName && (
            <Text style={s.cardCreator}>by {creatorName}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', flex: 1, marginRight: 10 },
  badge: { borderWidth: 0.5, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  badgeLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBottom: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  cardMeta: { fontSize: 12, color: '#626262' },
  cardCreator: { fontSize: 12, color: '#626262', marginLeft: 'auto' },
})
