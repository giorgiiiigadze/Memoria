import {
  acceptRequest,
  cancelRequest,
  declineRequest,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  searchUsers,
  sendRequest,
} from '@/api/friends.api'
import { selectUser, useAuthStore } from '@/store/auth.store'
import { useFriendsStore } from '@/store/friends.store'
import { useEffect, useState } from 'react'

export function useFriends() {
  const user = useAuthStore(selectUser)
  const { friends, incoming, outgoing, isLoaded, setFriends, setIncoming, setOutgoing, setIsLoaded } = useFriendsStore()
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (user?.id && !isLoaded) load()
  }, [user?.id])

  async function load() {
    if (!user) return
    try {
      const [f, inc, out] = await Promise.all([
        getFriends(user.id),
        getIncomingRequests(user.id),
        getOutgoingRequests(user.id),
      ])
      setFriends(f)
      setIncoming(inc)
      setOutgoing(out)
    } catch (e) {
      console.error('[useFriends] load error:', e)
    } finally {
      setIsLoaded(true)
    }
  }

  async function refresh() {
    if (!user) return
    try {
      const [f, inc, out] = await Promise.all([
        getFriends(user.id),
        getIncomingRequests(user.id),
        getOutgoingRequests(user.id),
      ])
      setFriends(f)
      setIncoming(inc)
      setOutgoing(out)
    } catch (e) {
      console.error('[useFriends] refresh:', e)
    }
  }

  async function add(addresseeId: string) {
    if (!user) return
    setActionLoading(true)
    try {
      await sendRequest(user.id, addresseeId)
      await refresh()
    } catch (e) {
      console.error('[useFriends] sendRequest error:', e)
      throw e
    } finally {
      setActionLoading(false)
    }
  }

  async function accept(friendshipId: string) {
    setActionLoading(true)
    try {
      await acceptRequest(friendshipId)
      await refresh()
    } catch (e) {
      console.error('[useFriends] accept error:', e)
      throw e
    } finally {
      setActionLoading(false)
    }
  }

  async function decline(friendshipId: string) {
    setActionLoading(true)
    try {
      await declineRequest(friendshipId)
      await refresh()
    } catch (e) {
      console.error('[useFriends] decline error:', e)
      throw e
    } finally {
      setActionLoading(false)
    }
  }

  async function cancel(friendshipId: string) {
    setActionLoading(true)
    try {
      await cancelRequest(friendshipId)
      await refresh()
    } catch (e) {
      console.error('[useFriends] cancel error:', e)
      throw e
    } finally {
      setActionLoading(false)
    }
  }

  async function search(query: string) {
    if (!user || !query.trim()) return []
    return searchUsers(query, user.id)
  }

  return { friends, incoming, outgoing, isLoaded, actionLoading, add, accept, decline, cancel, search, refresh }
}
