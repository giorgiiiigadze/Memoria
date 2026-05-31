import type { DropWithParticipants } from '@/api/drops.api'
import { DropCard } from '@/components/drops/DropCard'
import { useDrops } from '@/hooks/useDrops'
import { selectProfile, selectUser, useAuthStore } from '@/store/auth.store'
import { selectUnreadCount, useNotificationsStore } from '@/store/notifications.store'
import { router, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type ListItem =
  | { kind: 'section-header'; label: string; key: string }
  | { kind: 'drop'; drop: DropWithParticipants; showCreator: boolean; key: string }

function buildItems(
  myDrops: DropWithParticipants[],
  invitedDrops: DropWithParticipants[]
): ListItem[] {
  const items: ListItem[] = []
  if (myDrops.length > 0) {
    if (invitedDrops.length > 0) {
      items.push({ kind: 'section-header', label: 'Your Drops', key: 'header-my' })
    }
    myDrops.forEach(d => items.push({ kind: 'drop', drop: d, showCreator: false, key: d.id }))
  }
  if (invitedDrops.length > 0) {
    items.push({ kind: 'section-header', label: 'Invited', key: 'header-invited' })
    invitedDrops.forEach(d => items.push({ kind: 'drop', drop: d, showCreator: true, key: `invited-${d.id}` }))
  }
  return items
}

export default function HomeScreen() {
  const user = useAuthStore(selectUser)
  const profile = useAuthStore(selectProfile)
  const { drops, isLoaded, error, refresh, retry } = useDrops()
  const unreadCount = useNotificationsStore(selectUnreadCount)

  const displayName = profile?.display_name ?? profile?.username ?? user?.email ?? 'You'

  useFocusEffect(useCallback(() => { if (isLoaded) refresh() }, [isLoaded]))

  const myDrops = drops.filter(d => d.creator_id === user?.id)
  const invitedDrops = drops.filter(d => d.creator_id !== user?.id)
  const items = buildItems(myDrops, invitedDrops)

  const ListHeader = (
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
  )

  const ListEmpty = isLoaded ? (
    error ? (
      <View style={s.errorBox}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity onPress={retry} activeOpacity={0.7}>
          <Text style={s.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>No drops yet</Text>
        <Text style={s.emptySub}>Tap Create to start your first one.</Text>
      </View>
    )
  ) : null

  return (
    <FlatList
      style={s.root}
      contentContainerStyle={s.content}
      data={items}
      keyExtractor={item => item.key}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      renderItem={({ item }) => {
        if (item.kind === 'section-header') {
          return <Text style={s.sectionLabel}>{item.label}</Text>
        }
        return (
          <View style={s.cardWrapper}>
            <DropCard drop={item.drop} showCreator={item.showCreator} />
          </View>
        )
      }}
    />
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingTop: 72,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 13,
    color: '#626262',
    marginTop: 2,
  },

  // Notification bell
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  bellInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#191919',
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellText: {
    fontSize: 14,
    color: '#898989',
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EA4942',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: '#626262',
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#626262',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },

  // Cards
  cardWrapper: {
    marginBottom: 8,
  },

  // Error state
  errorBox: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#626262',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#0044FF',
    fontWeight: '500',
  },
})