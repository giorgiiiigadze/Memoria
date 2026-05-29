import { useDropsStore } from '@/store/drops.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { getMyDrops } from './drops.api'
import { getNotifications } from './notifications.api'
import { getDropPhotos, type PhotoWithUploader } from './photos.api'
import { supabase } from './client'

export function subscribeToUserDrops(userId: string): () => void {
  const channel = supabase
    .channel(`user-drops-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'drops', filter: `creator_id=eq.${userId}` },
      () => {
        getMyDrops()
          .then(drops => useDropsStore.getState().setDrops(drops))
          .catch(console.error)
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'drop_participants', filter: `user_id=eq.${userId}` },
      () => {
        getMyDrops()
          .then(drops => useDropsStore.getState().setDrops(drops))
          .catch(console.error)
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export function subscribeToNotifications(userId: string): () => void {
  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      () => {
        getNotifications(userId)
          .then(notifications => useNotificationsStore.getState().setNotifications(notifications))
          .catch(console.error)
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export function subscribeToDropPhotos(
  dropId: string,
  onPhotos: (photos: PhotoWithUploader[]) => void
): () => void {
  const channel = supabase
    .channel(`drop-photos-${dropId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'photos', filter: `drop_id=eq.${dropId}` },
      () => {
        getDropPhotos(dropId)
          .then(onPhotos)
          .catch(console.error)
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
