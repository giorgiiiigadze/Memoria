import { useDrops } from '@/hooks/useDrops'
import { selectProfile, selectUser, useAuthStore } from '@/store/auth.store'
import { selectUnreadCount, useNotificationsStore } from '@/store/notifications.store'
import { DropCard } from '@/components/drops/DropCard'
import { router, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

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
})
