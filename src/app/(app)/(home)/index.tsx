import type { DropWithParticipants } from '@/api/drops.api'
import { useDrops } from '@/hooks/useDrops'
import { selectProfile, selectUser, useAuthStore } from '@/store/auth.store'
import { selectUnreadCount, useNotificationsStore } from '@/store/notifications.store'
import type { DropState } from '@/types/database.types'
import { router, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatOpenDate(iso: string | null): string {
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

export default function HomeScreen() {
  const user = useAuthStore(selectUser)
  const profile = useAuthStore(selectProfile)
  const { drops, isLoaded, refresh } = useDrops()
  const unreadCount = useNotificationsStore(selectUnreadCount)

  const displayName = profile?.display_name ?? profile?.username ?? user?.email ?? 'You'

  useFocusEffect(useCallback(() => { if (isLoaded) refresh() }, [isLoaded]))

  const myDrops = drops.filter(d => d.creator_id === user?.id)
  const invitedDrops = drops.filter(d => d.creator_id !== user?.id)

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>

      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hey, {displayName}</Text>
          <Text style={s.sub}>{drops.length} drop{drops.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={s.bellBtn}
          onPress={() => router.push('/(home)/notifications' as any)}
          activeOpacity={0.7}
        >
          <View style={s.bellInner}>
            <Text style={s.bellText}>&#9679;</Text>
          </View>
          {unreadCount > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoaded && drops.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No drops yet</Text>
          <Text style={s.emptySub}>Tap Create to start your first one.</Text>
        </View>
      )}

      {myDrops.length > 0 && (
        <View style={s.section}>
          {invitedDrops.length > 0 && (
            <Text style={s.sectionLabel}>Your Drops</Text>
          )}
          {myDrops.map(drop => <DropCard key={drop.id} drop={drop} />)}
        </View>
      )}

      {invitedDrops.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Invited</Text>
          {invitedDrops.map(drop => <DropCard key={drop.id} drop={drop} showCreator />)}
        </View>
      )}

    </ScrollView>
  )
}

function DropCard({ drop, showCreator = false }: { drop: DropWithParticipants; showCreator?: boolean }) {
  const meta = STATE_META[drop.state]
  const participantCount = drop.participants?.length ?? 0
  const creatorName = drop.creator?.display_name ?? drop.creator?.username ?? null

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push({ pathname: `/drop/${drop.id}`, params: { from: '/(app)/(home)' } } as any)}
      activeOpacity={0.75}
    >
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
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  content: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  greeting: { fontSize: 22, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.5 },
  sub: { fontSize: 13, color: '#626262', marginTop: 2 },
  bellBtn: { position: 'relative', padding: 4 },
  bellInner: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#191919', borderWidth: 0.5, borderColor: '#3B3B3B',
    alignItems: 'center', justifyContent: 'center',
  },
  bellText: { fontSize: 14, color: '#898989' },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EA4942',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '500', color: '#FFFFFF', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#626262' },
  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: '#626262',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  card: {
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', flex: 1, marginRight: 10 },
  badge: { borderWidth: 0.5, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  badgeLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBottom: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  cardMeta: { fontSize: 12, color: '#626262' },
  cardCreator: { fontSize: 12, color: '#626262', marginLeft: 'auto' },
})
