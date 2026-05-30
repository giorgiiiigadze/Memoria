import { createDrop, deleteDrop, getMyDrops, inviteParticipants, updateDropThumbnail } from '@/api/drops.api'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { useEffect } from 'react'

export function useDrops() {
  const user = useAuthStore(selectUser)
  const { drops, isLoaded, error, draft, setDrops, setIsLoaded, setError, clearDraft } = useDropsStore()

  useEffect(() => {
    if (user?.id && !isLoaded) load()
  }, [user?.id])

  async function load() {
    try {
      const data = await getMyDrops()
      setDrops(data)
      setError(null)
    } catch (e) {
      console.error('[useDrops] load:', e)
      setError('Failed to load drops. Check your connection.')
    } finally {
      setIsLoaded(true)
    }
  }

  async function refresh() {
    if (!user) return
    try {
      const data = await getMyDrops()
      setDrops(data)
      setError(null)
    } catch (e) {
      console.error('[useDrops] refresh:', e)
      setError('Failed to refresh drops.')
    }
  }

  async function submitDrop(): Promise<void> {
    if (!user) throw new Error('Not authenticated')
    const { title, openDate, invitedIds, thumbnailUri } = draft

    const drop = await createDrop(title, openDate, user.id)

    if (thumbnailUri) {
      try {
        await updateDropThumbnail(drop.id, thumbnailUri)
      } catch (e) {
        // Remove the incomplete drop rather than leaving a thumbnail-less record
        await deleteDrop(drop.id).catch(() => {})
        throw new Error('Failed to upload cover photo. Please try again.')
      }
    }

    await inviteParticipants(drop.id, invitedIds, user.id)
    clearDraft()
    await load()
  }

  return {
    drops,
    isLoaded,
    error,
    draft,
    setDraftTitle: useDropsStore.getState().setDraftTitle,
    setDraftOpenDate: useDropsStore.getState().setDraftOpenDate,
    setDraftInvitedIds: useDropsStore.getState().setDraftInvitedIds,
    submitDrop,
    refresh,
    retry: load,
  }
}
