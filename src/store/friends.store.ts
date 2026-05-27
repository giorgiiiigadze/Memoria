import type { FriendRequest } from '@/api/friends.api'
import type { Profile } from '@/types/database.types'
import { create } from 'zustand'

interface FriendsState {
  friends: Profile[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  setFriends: (friends: Profile[]) => void
  setIncoming: (incoming: FriendRequest[]) => void
  setOutgoing: (outgoing: FriendRequest[]) => void
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  incoming: [],
  outgoing: [],
  setFriends: (friends) => set({ friends }),
  setIncoming: (incoming) => set({ incoming }),
  setOutgoing: (outgoing) => set({ outgoing }),
}))

export const selectFriends = (s: FriendsState) => s.friends
export const selectIncoming = (s: FriendsState) => s.incoming
export const selectOutgoing = (s: FriendsState) => s.outgoing
