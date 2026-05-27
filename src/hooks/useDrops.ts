import { createDrop, getMyDrops, inviteParticipants } from '@/api/drops.api'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useDropsStore } from '@/store/drops.store'
import { useEffect } from 'react'

export function useDrops() {
  const user = useAuthStore(selectUser)
  const { drops, isLoaded, draft, setDrops, setIsLoaded, clearDraft } = useDropsStore()

  useEffect(() => {
    if (user?.id && !isLoaded) load()
  }, [user?.id])

  async function load() {
    try {
      const data = await getMyDrops()
      setDrops(data)
    } catch (e) {
      console.error('[useDrops] load:', e)
    } finally {
      setIsLoaded(true)
    }
  }

  async function refresh() {
    if (!user) return
    try {
      const data = await getMyDrops()
      setDrops(data)
    } catch (e) {
      console.error('[useDrops] refresh:', e)
    }
  }

  async function submitDrop(): Promise<void> {
    if (!user) throw new Error('Not authenticated')
    const { title, openDate, invitedIds } = draft

    const drop = await createDrop(title, openDate, user.id)
    await inviteParticipants(drop.id, invitedIds, user.id)
    clearDraft()
    await load()
  }

  return {
    drops,
    isLoaded,
    draft,
    setDraftTitle: useDropsStore.getState().setDraftTitle,
    setDraftOpenDate: useDropsStore.getState().setDraftOpenDate,
    setDraftInvitedIds: useDropsStore.getState().setDraftInvitedIds,
    submitDrop,
    refresh,
  }
}
