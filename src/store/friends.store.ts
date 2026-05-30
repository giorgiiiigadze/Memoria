import type { FriendRequest } from '@/api/friends.api'
import type { Profile } from '@/types/database.types'
import { create } from 'zustand'

interface FriendsState {
  friends: Profile[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  isLoaded: boolean
  error: string | null
  setFriends: (friends: Profile[]) => void
  setIncoming: (incoming: FriendRequest[]) => void
  setOutgoing: (outgoing: FriendRequest[]) => void
  setIsLoaded: (loaded: boolean) => void
  setError: (error: string | null) => void
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  incoming: [],
  outgoing: [],
  isLoaded: false,
  error: null,
  setFriends: (friends) => set({ friends }),
  setIncoming: (incoming) => set({ incoming }),
  setOutgoing: (outgoing) => set({ outgoing }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  setError: (error) => set({ error }),
}))

export const selectFriends = (s: FriendsState) => s.friends
export const selectIncoming = (s: FriendsState) => s.incoming
export const selectOutgoing = (s: FriendsState) => s.outgoing
export const selectFriendsLoaded = (s: FriendsState) => s.isLoaded
export const selectFriendsError = (s: FriendsState) => s.error
