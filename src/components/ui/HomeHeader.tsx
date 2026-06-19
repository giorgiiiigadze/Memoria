import { selectUnreadCount, useNotificationsStore } from '@/store/notifications.store'
import { colors } from '@/theme'
import { Stack, router } from 'expo-router'

export default function HomeHeader() {
  const unreadCount = useNotificationsStore(selectUnreadCount)

  return (
    <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Notifications"
          tintColor={colors.white}
          onPress={() => router.push('/(app)/(tabs)/(home)/notifications' as any)}
        >
          <Stack.Toolbar.Icon sf="bell.fill" />
          {unreadCount > 0 && (
            <Stack.Toolbar.Badge>
              {unreadCount > 9 ? '9+' : String(unreadCount)}
            </Stack.Toolbar.Badge>
          )}
        </Stack.Toolbar.Button>
        
        <Stack.Toolbar.Button
          accessibilityLabel="New drop"
          tintColor={colors.white}
          onPress={() => router.push('/create' as any)}
        >
          <Stack.Toolbar.Icon sf="plus" />
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
  )
}
