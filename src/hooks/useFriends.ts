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
import { selectUser } from '@/store/auth.store'
import { useAuthStore } from '@/store/auth.store'
import { useFriendsStore } from '@/store/friends.store'
import { useEffect, useState } from 'react'

export function useFriends() {
  const user = useAuthStore(selectUser)
  const { friends, incoming, outgoing, setFriends, setIncoming, setOutgoing } = useFriendsStore()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (user?.id) load()
  }, [user?.id])

  async function load() {
    if (!user) return
    setLoading(true)
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
      setLoading(false)
    }
  }

  async function add(addresseeId: string) {
    if (!user) return
    setActionLoading(true)
    try {
      await sendRequest(user.id, addresseeId)
      await load()
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
      await load()
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
      await load()
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
      await load()
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

  return {
    friends,
    incoming,
    outgoing,
    loading,
    actionLoading,
    add,
    accept,
    decline,
    cancel,
    search,
    reload: load,
  }
}
