// ─── Hero Video ───────────────────────────────────────────────────────────────
// Upload rules for the landing hero clip. The clip autoplays for every desktop
// visitor and Supabase free tier egress is limited, so it is kept short and small.

export const HERO_VIDEO_MAX_MB = 20

/** MP4 plays everywhere; WebM is accepted but Safari support is patchy. */
export const HERO_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const

export type HeroVideoProblem = 'type' | 'size'

/** Returns why a picked file cannot be used as the hero video, or null when it is fine. */
export function checkHeroVideo(file: { type: string; size: number }): HeroVideoProblem | null {
  if (!(HERO_VIDEO_TYPES as readonly string[]).includes(file.type)) return 'type'
  if (file.size > HERO_VIDEO_MAX_MB * 1024 * 1024) return 'size'
  return null
}

/** Storage file extension for an accepted hero video type. */
export function heroVideoExtension(type: string): 'mp4' | 'webm' {
  return type === 'video/webm' ? 'webm' : 'mp4'
}
