import {
  getNotifications,
  markNotificationRead,
  type NotificationWithMeta,
} from '@/api/notifications.api'
import NotificationItem from '@/components/ui/NotificationItem'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { colors, fontSize, fontWeight, spacing } from '@/theme'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native'

function handleTap(n: NotificationWithMeta) {
  markNotificationRead(n.id).catch(console.error)
  if (n.drop_id) {
    router.push({ pathname: '/drop/[id]', params: { id: n.drop_id, backTitle: 'Notifications' } } as any)
  } else if (n.type === 'friend_request' || n.type === 'friend_accepted') {
    router.navigate('/(app)/(friends)' as any)
  }
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

function buildSections(notifications: NotificationWithMeta[]) {
  const today = notifications.filter(n => isToday(n.created_at))
  const earlier = notifications.filter(n => !isToday(n.created_at))
  const sections = []
  if (today.length > 0) sections.push({ title: 'Today', data: today })
  if (earlier.length > 0) sections.push({ title: 'Earlier', data: earlier })
  return sections
}

export default function NotificationsScreen() {
  const user = useAuthStore(selectUser)
  const { notifications, setNotifications, markOneRead } = useNotificationsStore()
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    if (!user?.id) return
    getNotifications(user.id).then(setNotifications).catch(console.error)
  }, [user?.id])

  useFocusEffect(load)

  const onRefresh = useCallback(async () => {
    if (!user?.id) return
    setRefreshing(true)
    try {
      const data = await getNotifications(user.id)
      setNotifications(data)
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }, [user?.id])

  const sections = buildSections(notifications)

  return (
    <SectionList
      sections={sections}
      keyExtractor={item => item.id}
      style={s.root}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.white}
        />
      }
      renderSectionHeader={({ section }) => (
        <Text style={s.sectionLabel}>{section.title}</Text>
      )}
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
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    textTransform: 'capitalize',
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
