import type { DropWithParticipants } from '@/api/drops.api'
import { create } from 'zustand'

interface Draft {
  title: string
  openDate: Date | null
  invitedIds: string[]
  thumbnailUri: string | null
}

const EMPTY_DRAFT: Draft = { title: '', openDate: null, invitedIds: [], thumbnailUri: null }

interface DropsState {
  drops: DropWithParticipants[]
  isLoaded: boolean
  draft: Draft
  setDrops: (drops: DropWithParticipants[]) => void
  setIsLoaded: (loaded: boolean) => void
  setDraftTitle: (title: string) => void
  setDraftOpenDate: (date: Date | null) => void
  setDraftInvitedIds: (ids: string[]) => void
  setDraftThumbnailUri: (uri: string | null) => void
  clearDraft: () => void
}

export const useDropsStore = create<DropsState>((set) => ({
  drops: [],
  isLoaded: false,
  draft: EMPTY_DRAFT,
  setDrops: (drops) => set({ drops }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  setDraftTitle: (title) => set((s) => ({ draft: { ...s.draft, title } })),
  setDraftOpenDate: (openDate) => set((s) => ({ draft: { ...s.draft, openDate } })),
  setDraftInvitedIds: (invitedIds) => set((s) => ({ draft: { ...s.draft, invitedIds } })),
  setDraftThumbnailUri: (thumbnailUri) => set((s) => ({ draft: { ...s.draft, thumbnailUri } })),
  clearDraft: () => set({ draft: EMPTY_DRAFT }),
}))

export const selectDrops = (s: DropsState) => s.drops
export const selectDropsLoaded = (s: DropsState) => s.isLoaded
export const selectDraft = (s: DropsState) => s.draft
