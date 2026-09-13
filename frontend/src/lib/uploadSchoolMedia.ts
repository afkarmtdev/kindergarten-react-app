import { supabase } from '@/lib/supabaseClient'
import { compressImage } from '@/lib/compressImage'

export type SchoolMediaFolder = 'principal' | 'about' | 'team'

/**
 * Uploads a school identity photo (principal, story photos, team members) to
 * the public `school-logo` bucket under a folder prefix and returns its URL.
 * Reuses the logo bucket so no extra Supabase setup is needed.
 */
export async function uploadSchoolMedia(file: File, folder: SchoolMediaFolder): Promise<string> {
  const compressed = await compressImage(file, 1000, 0.85)
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const { error } = await supabase.storage.from('school-logo').upload(path, compressed)
  if (error) throw error
  const { data } = supabase.storage.from('school-logo').getPublicUrl(path)
  return data.publicUrl
}
