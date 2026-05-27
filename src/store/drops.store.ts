import type { DropWithParticipants } from '@/api/drops.api'
import { create } from 'zustand'

interface Draft {
  title: string
  openDate: Date | null
  invitedIds: string[]
}

const EMPTY_DRAFT: Draft = { title: '', openDate: null, invitedIds: [] }

interface DropsState {
  drops: DropWithParticipants[]
  isLoaded: boolean
  draft: Draft
  setDrops: (drops: DropWithParticipants[]) => void
  setIsLoaded: (loaded: boolean) => void
  setDraftTitle: (title: string) => void
  setDraftOpenDate: (date: Date | null) => void
  setDraftInvitedIds: (ids: string[]) => void
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
  clearDraft: () => set({ draft: EMPTY_DRAFT }),
}))

export const selectDrops = (s: DropsState) => s.drops
export const selectDropsLoaded = (s: DropsState) => s.isLoaded
export const selectDraft = (s: DropsState) => s.draft
