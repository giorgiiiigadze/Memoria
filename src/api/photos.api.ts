import { supabase } from '@/api/client'
import type { Photo } from '@/types/database.types'

export type PhotoWithUploader = Photo & {
  uploader: { username: string; display_name: string | null; avatar_url: string | null } | null
}

export async function getDropPhotos(dropId: string): Promise<PhotoWithUploader[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*, uploader:profiles!uploader_id(username, display_name, avatar_url)')
    .eq('drop_id', dropId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PhotoWithUploader[]
}

export async function uploadDropPhoto(
  dropId: string,
  uploaderId: string,
  localUri: string,
  width: number | null,
  height: number | null
): Promise<Photo> {
  const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg'
  const fileName = `${dropId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const response = await fetch(localUri)
  const arrayBuffer = await response.arrayBuffer()

  const { error: storageError } = await supabase.storage
    .from('photos')
    .upload(fileName, arrayBuffer, { contentType: `image/${ext}` })

  if (storageError) throw storageError

  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName)

  const { data: photo, error: insertError } = await supabase
    .from('photos')
    .insert({ drop_id: dropId, uploader_id: uploaderId, storage_path: fileName, cdn_url: publicUrl, width, height })
    .select()
    .single()

  if (insertError) throw insertError

  // Update participant: accept invite if still pending + track upload count
  const { data: participant } = await supabase
    .from('drop_participants')
    .select('id, upload_count, status')
    .eq('drop_id', dropId)
    .eq('user_id', uploaderId)
    .maybeSingle()

  if (participant) {
    await supabase
      .from('drop_participants')
      .update({
        status: 'accepted' as const,
        has_uploaded: true,
        upload_count: participant.upload_count + 1,
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', participant.id)
  }

  return photo
}
