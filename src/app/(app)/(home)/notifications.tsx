import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationWithMeta,
} from '@/api/notifications.api'
import { selectUser, useAuthStore } from '@/store/auth.store'
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function notifText(n: NotificationWithMeta): string {
  const actor =
    n.actor?.display_name ?? (n.actor?.username ? `@${n.actor.username}` : 'Someone')
  const drop = n.drop?.title ? `"${n.drop.title}"` : 'a drop'
  switch (n.type) {
    case 'drop_invited':
      return `${actor} invited you to ${drop}`
    case 'drop_opened':
      return `${drop} is now open — see the photos`
    case 'drop_ready':
      return `${drop} is ready to open`
    case 'friend_request':
      return `${actor} sent you a friend request`
    case 'friend_accepted':
      return `${actor} accepted your friend request`
    case 'participant_uploaded':
      return `${actor} uploaded photos to ${drop}`
    case 'drop_opening_soon':
      return `${drop} opens soon`
    case 'drop_expired':
      return `${drop} has expired`
    default:
      return 'New notification'
  }
}

function handleTap(n: NotificationWithMeta) {
  markNotificationRead(n.id).catch(console.error)
  if (n.drop_id) {
    router.push({
      pathname: `/drop/${n.drop_id}`,
      params: { from: '/(app)/(home)' },
    } as any)
  } else if (n.type === 'friend_request' || n.type === 'friend_accepted') {
    router.navigate('/(app)/(friends)' as any)
  }
}

export default function NotificationsScreen() {
  const user = useAuthStore(selectUser)
  const { notifications, setNotifications, markOneRead, markAllRead } = useNotificationsStore()
  const unreadCount = useNotificationsStore(selectUnreadCount)

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return
      getNotifications(user.id).then(setNotifications).catch(console.error)
    }, [user?.id])
  )

  async function handleMarkAll() {
    if (!user?.id) return
    markAllRead()
    await markAllNotificationsRead(user.id)
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAll} activeOpacity={0.7}>
            <Text style={s.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No notifications yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.item, !item.read && s.itemUnread]}
            onPress={() => {
              if (!item.read) markOneRead(item.id)
              handleTap(item)
            }}
            activeOpacity={0.75}
          >
            {!item.read && <View style={s.dot} />}
            <View style={s.itemBody}>
              <Text style={s.itemText}>{notifText(item)}</Text>
              <Text style={s.itemTime}>{timeAgo(item.created_at)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#252525',
  },
  back: { fontSize: 15, color: '#898989', minWidth: 50 },
  title: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  markAll: { fontSize: 13, color: '#0044FF', minWidth: 80, textAlign: 'right' },
  list: { paddingVertical: 8 },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#626262' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1E1E1E',
    gap: 10,
  },
  itemUnread: { backgroundColor: '#161622' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0044FF',
    marginTop: 5,
    flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 4 },
  itemText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  itemTime: { fontSize: 12, color: '#626262' },
})
