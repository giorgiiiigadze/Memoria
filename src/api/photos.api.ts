import { supabase } from '@/api/client'
import { ALLOWED_EXTENSIONS, MAX_BYTES } from '@/constants/media'
import type { Photo } from '@/types/database.types'

export type PhotoWithUploader = Photo & {
  uploader: { username: string; display_name: string | null; avatar_url: string | null } | null
}

let _storyCache: PhotoWithUploader[] = []
export const primeStoryCache = (photos: PhotoWithUploader[]) => { _storyCache = photos }
export const consumeStoryCache = (): PhotoWithUploader[] => {
  const cached = _storyCache
  _storyCache = []
  return cached
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
): Promise<void> {
  const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg'
  if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`Unsupported file type: .${ext}`)

  const fileName = `${dropId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const response = await fetch(localUri)
  const arrayBuffer = await response.arrayBuffer()

  if (arrayBuffer.byteLength > MAX_BYTES) throw new Error('Photo exceeds 50 MB limit')

  const { error: storageError } = await supabase.storage
    .from('photos')
    .upload(fileName, arrayBuffer, { contentType: `image/${ext}` })

  if (storageError) throw storageError

  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName)

  const { data: lastPhoto } = await supabase
    .from('photos')
    .select('sort_order')
    .eq('drop_id', dropId)
    .eq('uploader_id', uploaderId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (lastPhoto?.sort_order ?? -1) + 1

  const { error: insertError } = await supabase
    .from('photos')
    .insert({ drop_id: dropId, uploader_id: uploaderId, storage_path: fileName, cdn_url: publicUrl, width, height, sort_order: sortOrder })

  if (insertError) throw insertError

  await supabase
    .from('drop_participants')
    .update({ status: 'accepted' as const, has_uploaded: true, uploaded_at: new Date().toISOString() })
    .eq('drop_id', dropId)
    .eq('user_id', uploaderId)
}

export async function deleteDropPhoto(photoId: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from('photos').remove([storagePath])
  if (storageError) throw storageError
  const { error } = await supabase.from('photos').delete().eq('id', photoId)
  if (error) throw error
}