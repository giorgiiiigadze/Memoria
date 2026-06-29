import { supabase } from '@/api/client'
import type { NotificationType } from '@/types/database.types'

export type NotificationWithMeta = {
  id: string
  user_id: string
  type: NotificationType
  drop_id: string | null
  actor_id: string | null
  read: boolean
  sent_push: boolean
  created_at: string
  actor: { username: string; display_name: string | null; avatar_url: string | null } | null
  drop: { title: string; thumbnail_url: string | null } | null
}

export async function getNotifications(userId: string): Promise<NotificationWithMeta[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!actor_id(username, display_name, avatar_url), drop:drops!drop_id(title, thumbnail_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as unknown as NotificationWithMeta[]
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
  if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
}
