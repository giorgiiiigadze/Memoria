import { useDropsStore } from '@/store/drops.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { getDrop } from './drops.api'
import { getNotifications } from './notifications.api'
import { getDropPhotos, type PhotoWithUploader } from './photos.api'
import { supabase } from './client'

function patchDrop(dropId: string) {
  getDrop(dropId)
    .then(drop => {
      const store = useDropsStore.getState()
      if (drop) {
        const exists = store.drops.some(d => d.id === dropId)
        store.setDrops(
          exists
            ? store.drops.map(d => (d.id === dropId ? drop : d))
            : [drop, ...store.drops]
        )
      } else {
        store.setDrops(store.drops.filter(d => d.id !== dropId))
      }
    })
    .catch(console.error)
}

export function subscribeToUserDrops(userId: string): () => void {
  const channel = supabase
    .channel(`user-drops-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'drops' },
      (payload) => {
        const dropId =
          (payload.new as { id?: string } | undefined)?.id ??
          (payload.old as { id?: string } | undefined)?.id
        if (dropId) patchDrop(dropId)
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'drop_participants', filter: `user_id=eq.${userId}` },
      (payload) => {
        const dropId =
          (payload.new as { drop_id?: string } | undefined)?.drop_id ??
          (payload.old as { drop_id?: string } | undefined)?.drop_id
        if (dropId) patchDrop(dropId)
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
