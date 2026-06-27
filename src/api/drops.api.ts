import { supabase } from '@/api/client'
import { ALLOWED_EXTENSIONS, MAX_BYTES } from '@/constants/media'
import type { Drop, DropParticipant, Profile } from '@/types/database.types'

export type DropWithParticipants = Drop & {
  participants: (Pick<DropParticipant, 'id' | 'user_id' | 'status' | 'has_uploaded'> & {
    profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'> | null
  })[]
  creator: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

const DROP_SELECT = '*, participants:drop_participants(id, user_id, status, has_uploaded, profile:profiles!user_id(id, username, display_name, avatar_url)), creator:profiles!creator_id(id, username, display_name, avatar_url)'

export async function getMyDrops(): Promise<DropWithParticipants[]> {
  const { data, error } = await supabase
    .from('drops')
    .select(DROP_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as DropWithParticipants[]
}

export async function getMyCreatedDrops(): Promise<DropWithParticipants[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('drops')
    .select(DROP_SELECT)
    .eq('creator_id', user.id)
    .order('open_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as DropWithParticipants[]
}

export async function getDrop(dropId: string): Promise<DropWithParticipants | null> {
  const { data, error } = await supabase
    .from('drops')
    .select(DROP_SELECT)
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

export async function updateDropThumbnail(dropId: string, uri: string): Promise<void> {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg'
  if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`Unsupported file type: .${ext}`)

  const path = `${dropId}/thumbnail.${ext}`
  const arrayBuffer = await (await fetch(uri)).arrayBuffer()

  if (arrayBuffer.byteLength > MAX_BYTES) throw new Error('Photo exceeds 50 MB limit')

  const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`
  const { error: upErr } = await supabase.storage
    .from('photos')
    .upload(path, arrayBuffer, { upsert: true, contentType: mimeType })
  if (upErr) throw upErr
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  const { error } = await supabase.from('drops').update({ thumbnail_url: data.publicUrl }).eq('id', dropId)
  if (error) {
    await supabase.storage.from('photos').remove([path]).catch(() => {})
    throw error
  }
}

export async function pinDrop(dropId: string, pinned: boolean): Promise<void> {
  const { error } = await supabase.from('drops').update({ is_pinned: pinned }).eq('id', dropId)
  if (error) throw error
}

export async function deleteDrop(dropId: string): Promise<void> {
  const { error } = await supabase.from('drops').delete().eq('id', dropId)
  if (error) throw error
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
