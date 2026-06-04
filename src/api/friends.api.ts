import { supabase } from '@/api/client'
import type { Friendship, Profile } from '@/types/database.types'

export type FriendRequest = {
  friendship: Friendship
  profile: Profile
}

export async function searchUsers(query: string, myId: string): Promise<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>[]> {
  if (!query.trim()) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query.trim()}%`)
    .neq('id', myId)
    .limit(20)
  if (error) throw error
  return (data ?? []) as unknown as Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>[]
}

export async function getFriends(myId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url),
      addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`)
  if (error) throw error
  return (data ?? []).map((f: any) =>
    f.requester_id === myId ? f.addressee : f.requester
  )
}

export async function getIncomingRequests(myId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('addressee_id', myId)
    .eq('status', 'pending')
  if (error) throw error
  return (data ?? []).map((f: any) => ({ friendship: f as Friendship, profile: f.requester as Profile }))
}

export async function getOutgoingRequests(myId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('requester_id', myId)
    .eq('status', 'pending')
  if (error) throw error
  return (data ?? []).map((f: any) => ({ friendship: f as Friendship, profile: f.addressee as Profile }))
}

export async function sendRequest(myId: string, addresseeId: string): Promise<Friendship> {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: myId, addressee_id: addresseeId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function acceptRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
  if (error) throw error
}

export async function declineRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
  if (error) throw error
}

export async function cancelRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
  if (error) throw error
}
