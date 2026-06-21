import {
  getNotifications,
  markNotificationRead,
  type NotificationWithMeta,
} from '@/api/notifications.api'
import NotificationItem from '@/components/ui/NotificationItem'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { colors } from '@/theme'
import { router, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'

function handleTap(n: NotificationWithMeta) {
  markNotificationRead(n.id).catch(console.error)
  if (n.drop_id) {
    router.push({ pathname: `/drop/${n.drop_id}` } as any)
  } else if (n.type === 'friend_request' || n.type === 'friend_accepted') {
    router.navigate('/(app)/(friends)' as any)
  }
}

export default function NotificationsScreen() {
  const user = useAuthStore(selectUser)
  const { notifications, setNotifications, markOneRead } = useNotificationsStore()

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return
      getNotifications(user.id).then(setNotifications).catch(console.error)
    }, [user?.id])
  )

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      style={s.root}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyText}>No notifications yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <NotificationItem
          item={item}
          onPress={it => {
            if (!it.read) markOneRead(it.id)
            handleTap(it)
          }}
        />
      )}
    />
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingVertical: 8,
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
})
