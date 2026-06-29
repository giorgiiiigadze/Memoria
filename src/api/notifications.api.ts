import { supabase } from '@/api/client'
import type { NotificationType } from '@/types/database.types'

const ACTOR_REQUIRED: NotificationType[] = ['friend_request', 'friend_accepted', 'drop_invited', 'participant_uploaded']

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
  drop: { title: string; thumbnail_url: string | null; creator: { id: string; display_name: string | null; avatar_url: string | null } | null } | null
}

export async function getNotifications(userId: string): Promise<NotificationWithMeta[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!actor_id(username, display_name, avatar_url), drop:drops!drop_id(title, thumbnail_url, creator:profiles!creator_id(id, display_name, avatar_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  const all = (data ?? []) as unknown as NotificationWithMeta[]
  return all.filter(n => !ACTOR_REQUIRED.includes(n.type) || n.actor != null)
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
