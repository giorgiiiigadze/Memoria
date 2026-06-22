import { getNotifications } from '@/api/notifications.api'
import { supabase } from '@/api/client'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useNotificationsStore } from '@/store/notifications.store'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export function useNotifications() {
  const user = useAuthStore(selectUser)
  const setNotifications = useNotificationsStore((s) => s.setNotifications)

  useEffect(() => {
    if (!user?.id) return
    registerForPushAsync().then((token) => {
      if (token) {
        supabase.from('profiles').update({ push_token: token }).eq('id', user.id).then(() => {}, console.error)
      }
    })
    getNotifications(user.id).then(setNotifications).catch(console.error)
  }, [user?.id])

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>
      if (data.drop_id) {
        router.push({
          pathname: '/drop/[id]',
          params: { id: data.drop_id },
        } as any)
      } else if (data.type === 'friend_request' || data.type === 'friend_accepted') {
        router.navigate('/(app)/(friends)' as any)
      }
    })
    return () => sub.remove()
  }, [])
}

async function registerForPushAsync(): Promise<string | null> {
  if (!Device.isDevice) return null
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Memoria',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    const result = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync()
    return result.data
  } catch (e) {
    console.error('[push] token registration failed:', e)
    return null
  }
}
