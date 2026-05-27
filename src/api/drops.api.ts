import { supabase } from '@/api/client'
import type { Drop, DropParticipant } from '@/types/database.types'

export type DropWithParticipants = Drop & {
  participants: Pick<DropParticipant, 'id' | 'user_id' | 'status' | 'has_uploaded'>[]
}

export async function getMyDrops(): Promise<DropWithParticipants[]> {
  const { data, error } = await supabase
    .from('drops')
    .select('*, participants:drop_participants(id, user_id, status, has_uploaded)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as DropWithParticipants[]
}

export async function getDrop(dropId: string): Promise<DropWithParticipants | null> {
  const { data, error } = await supabase
    .from('drops')
    .select('*, participants:drop_participants(id, user_id, status, has_uploaded)')
    .eq('id', dropId)
    .maybeSingle()
  if (error) throw error
  return data as DropWithParticipants | null
}

export async function createDrop(
  title: string,
  openDate: Date | null,
  creatorId: string
): Promise<Drop> {
  const { data, error } = await supabase
    .from('drops')
    .insert({ title, creator_id: creatorId, open_date: openDate?.toISOString() ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function inviteParticipants(
  dropId: string,
  userIds: string[],
  invitedBy: string
): Promise<void> {
  if (userIds.length === 0) return
  const { error } = await supabase.from('drop_participants').insert(
    userIds.map(userId => ({ drop_id: dropId, user_id: userId, invited_by: invitedBy, status: 'invited' as const }))
  )
  if (error) throw error
}
