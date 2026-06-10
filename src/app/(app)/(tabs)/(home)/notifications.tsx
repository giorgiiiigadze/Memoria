import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationWithMeta,
} from '@/api/notifications.api'
import { GlassCloseButton } from '@/components/ui/GlassCloseButton'
import NotificationItem from '@/components/ui/NotificationItem'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { selectUnreadCount, useNotificationsStore } from '@/store/notifications.store'
import { HEADER_HEIGHT } from '@/utils/notifications'
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { router, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const glassAvailable = isGlassEffectAPIAvailable()

function handleTap(n: NotificationWithMeta) {
  markNotificationRead(n.id).catch(console.error)

  const navigate = () => {
    if (n.drop_id) {
      router.push({
        pathname: `/drop/${n.drop_id}`,
        params: { from: '/(app)/(home)' },
      } as any)
    } else if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      router.navigate('/(app)/(friends)' as any)
    }
  }

  if (router.canDismiss()) {
    router.dismiss()
  }
  requestAnimationFrame(navigate)
}

export default function NotificationsScreen() {
  const user = useAuthStore(selectUser)
  const { notifications, setNotifications, markOneRead, markAllRead } = useNotificationsStore()
  const unreadCount = useNotificationsStore(selectUnreadCount)
  const insets = useSafeAreaInsets()

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
      {glassAvailable ? (
        <GlassView
          style={[StyleSheet.absoluteFill, s.glass]}
          glassEffectStyle="regular"
          colorScheme="dark"
          tintColor="rgba(20,20,20,0.25)"
          collapsable={false}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.fallbackPanel]} collapsable={false} />
      )}

      <View style={[s.grabberWrap, { paddingTop: insets.top > 0 ? 12 : 16 }]}>
        <View style={s.grabber} />
      </View>

      <View style={s.content} collapsable={false}>
        <View style={s.header} collapsable={false}>
          <View style={s.sideSlot}>
            <GlassCloseButton onPress={() => router.back()} />
          </View>
          <Text style={s.title}>Notifications</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity style={s.sideSlot} onPress={handleMarkAll} activeOpacity={0.7}>
              <Text style={s.markAll}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.sideSlot} />
          )}
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          style={s.flex}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No notifications yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={(it) => {
                if (!it.read) markOneRead(it.id)
                handleTap(it)
              }}
            />
          )}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    // Push sheet down so the underlying screen peeks above it
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  glass: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  fallbackPanel: {
    backgroundColor: 'rgba(18,18,18,0.88)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  grabberWrap: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 4,
    height: HEADER_HEIGHT,
    zIndex: 10,
    elevation: 10,
  },
  sideSlot: { width: 'auto', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', flex: 1, textAlign: 'center' },
  markAll: { fontSize: 13, color: '#5B8CFF', textAlign: 'right' },
  list: { paddingTop: 8, paddingBottom: 8 },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 10,
    backgroundColor: 'transparent',
  },
  itemUnread: { backgroundColor: 'rgba(255,255,255,0.07)' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5B8CFF',
    marginTop: 5,
    flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 4 },
  itemText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  itemTime: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
})