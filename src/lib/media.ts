import { requireSupabase } from './supabase'
export function validateImageBytes(mime: string, size: number, bytes: Uint8Array) {
  if (size < 1 || size > 5 * 1024 * 1024) throw new Error('image_size')
  const png = bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const webp = String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP'
  if (!(mime === 'image/png' && png || mime === 'image/jpeg' && jpeg || mime === 'image/webp' && webp)) throw new Error('image_type')
}
export async function uploadImage(file: File, profileId: string): Promise<string> {
  validateImageBytes(file.type, file.size, new Uint8Array(await file.slice(0, 12).arrayBuffer()))
  // Re-encode raster pixels: strips EXIF and active/polyglot payloads from normal UI uploads.
  const bitmap = await createImageBitmap(file)
  if (bitmap.width * bitmap.height > 40_000_000) { bitmap.close(); throw new Error('image_dimensions') }
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('image_decode')), 'image/webp', 0.88))
  const client = requireSupabase()
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user) throw new Error('unauthorized')
  const path = `${user.id}/${profileId}/${crypto.randomUUID()}.webp`
  const { error } = await client.storage.from('profile-media').upload(path, blob, { contentType: 'image/webp', upsert: false, cacheControl: '60' })
  if (error) throw error
  return path
}
export async function mediaUrl(path: string): Promise<string> {
  if (!path) return ''
  const { data, error } = await requireSupabase().storage.from('profile-media').createSignedUrl(path, 60)
  if (error) throw error
  return data.signedUrl
}
