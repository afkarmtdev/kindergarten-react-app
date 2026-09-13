// ─── Landing Content ──────────────────────────────────────────────────────────
// Zod schema + sanitiser for school_info.landing_content. Pure — no Supabase —
// so it can be unit tested without the route.

import { z } from 'zod'
import { stripHtml } from './sanitise'

const bilingual = z.object({
  en: z.string().max(2000).default(''),
  ms: z.string().max(2000).default(''),
})

const httpsUrl = z
  .string()
  .url()
  .max(1000)
  .refine((v) => v.startsWith('https://'), { message: 'Must be an https URL' })
const optionalUrl = httpsUrl.nullable().optional().default(null)

export const FEATURE_KEYS = ['learn', 'safe', 'arts', 'play', 'outdoor', 'class'] as const

export const landingHeroSchema = z.object({
  tagline: bilingual.default({ en: '', ms: '' }),
  headline_start: bilingual.default({ en: '', ms: '' }),
  headline_highlight: bilingual.default({ en: '', ms: '' }),
  headline_end: bilingual.default({ en: '', ms: '' }),
  subtitle: bilingual.default({ en: '', ms: '' }),
})

export const landingAboutSchema = z.object({
  enabled: z.boolean().default(false),
  founded_year: z.coerce.number().int().min(1900).max(2100).nullable().optional().default(null),
  story: bilingual.default({ en: '', ms: '' }),
  approach: bilingual.default({ en: '', ms: '' }),
  principal_message: bilingual.default({ en: '', ms: '' }),
  principal_photo_url: optionalUrl,
  photo_urls: z.array(httpsUrl).max(3).default([]),
})

export const landingStatsSchema = z.object({
  mode: z.enum(['live', 'manual', 'hidden']).default('manual'),
  students: z.coerce.number().int().min(0).max(100000).default(0),
  staff: z.coerce.number().int().min(0).max(100000).default(0),
  classes: z.coerce.number().int().min(0).max(100000).default(0),
  rating: z.coerce.number().min(0).max(5).default(0),
})

export const landingFeaturesSchema = z.object({
  enabled: z
    .array(z.enum(FEATURE_KEYS))
    .max(FEATURE_KEYS.length)
    .default([...FEATURE_KEYS]),
})

export const landingTeamSchema = z.object({
  enabled: z.boolean().default(false),
  members: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        name: z.string().min(1).max(120),
        role: bilingual.default({ en: '', ms: '' }),
        photo_url: optionalUrl,
      })
    )
    .max(24)
    .default([]),
})

/** PUT body — every top-level section is optional so a Settings panel can save just its slice. */
export const landingContentPatchSchema = z.object({
  hero: landingHeroSchema.optional(),
  about: landingAboutSchema.optional(),
  stats: landingStatsSchema.optional(),
  features: landingFeaturesSchema.optional(),
  team: landingTeamSchema.optional(),
})

export type LandingContentPatch = z.infer<typeof landingContentPatchSchema>

function cleanBilingual<T extends { en: string; ms: string }>(b: T): T {
  return { ...b, en: stripHtml(b.en).trim(), ms: stripHtml(b.ms).trim() }
}

/** Strips HTML from every free-text field. Structure is preserved. */
export function sanitiseLandingPatch(patch: LandingContentPatch): LandingContentPatch {
  const out: LandingContentPatch = {}
  if (patch.hero) {
    out.hero = {
      tagline: cleanBilingual(patch.hero.tagline),
      headline_start: cleanBilingual(patch.hero.headline_start),
      headline_highlight: cleanBilingual(patch.hero.headline_highlight),
      headline_end: cleanBilingual(patch.hero.headline_end),
      subtitle: cleanBilingual(patch.hero.subtitle),
    }
  }
  if (patch.about) {
    out.about = {
      ...patch.about,
      story: cleanBilingual(patch.about.story),
      approach: cleanBilingual(patch.about.approach),
      principal_message: cleanBilingual(patch.about.principal_message),
    }
  }
  if (patch.stats) out.stats = { ...patch.stats }
  if (patch.features) {
    // De-duplicate while keeping the school's chosen order
    out.features = { enabled: Array.from(new Set(patch.features.enabled)) }
  }
  if (patch.team) {
    out.team = {
      enabled: patch.team.enabled,
      members: patch.team.members.map((m) => ({
        ...m,
        id: stripHtml(m.id).trim(),
        name: stripHtml(m.name).trim(),
        role: cleanBilingual(m.role),
      })),
    }
  }
  return out
}

/** Shallow-merges a patch over the stored content, section by section. */
export function mergeLandingContent(
  existing: Record<string, unknown> | null | undefined,
  patch: LandingContentPatch
): Record<string, unknown> {
  return { ...(existing ?? {}), ...patch }
}
