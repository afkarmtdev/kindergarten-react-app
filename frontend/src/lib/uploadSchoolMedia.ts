import { supabase } from '@/lib/supabaseClient'
import { compressImage } from '@/lib/compressImage'
import { heroVideoExtension } from '@/lib/heroVideo'

/**
 * Public bucket for everything the school uploads for its website: logo,
 * principal / story / team photos and the hero video, each under a folder
 * prefix. Older files may still live in the legacy `school-logo` bucket; their
 * saved URLs keep working because that bucket is left in place.
 */
export const SCHOOL_MEDIA_BUCKET = 'school-media'

export type SchoolMediaFolder = 'principal' | 'about' | 'team' | 'registration'

function uniqueName(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function publicUrl(path: string): string {
  return supabase.storage.from(SCHOOL_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

/**
 * Uploads a school identity image (principal, story photos, team members, the
 * registration QR code) and returns its URL.
 */
export async function uploadSchoolMedia(file: File, folder: SchoolMediaFolder): Promise<string> {
  const compressed = await compressImage(file, 1000, 0.85)
  const path = `${folder}/${uniqueName()}.jpg`
  const { error } = await supabase.storage.from(SCHOOL_MEDIA_BUCKET).upload(path, compressed)
  if (error) throw error
  return publicUrl(path)
}

/**
 * Uploads the landing hero clip as-is (no re-encoding in the browser) under
 * `hero/`. Every upload gets a fresh name, so it is cached for a year to spare
 * egress on repeat visits. Call checkHeroVideo() first.
 */
export async function uploadHeroVideo(file: File): Promise<string> {
  const path = `hero/${uniqueName()}.${heroVideoExtension(file.type)}`
  const { error } = await supabase.storage
    .from(SCHOOL_MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) throw error
  return publicUrl(path)
}
