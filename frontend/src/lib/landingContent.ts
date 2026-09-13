import { BookOpen, Shield, Music, Palette, Sun, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TranslationKey } from '@/lib/translations'
import type {
  BilingualText,
  LandingContent,
  LandingFeatureKey,
  LandingStats,
  PublicStats,
} from '@/types'

export const EMPTY_TEXT: BilingualText = { en: '', ms: '' }

export const FEATURE_KEYS: LandingFeatureKey[] = [
  'learn',
  'safe',
  'arts',
  'play',
  'outdoor',
  'class',
]

/** Built-in programme cards. The school chooses which ones apply and in what order. */
export const FEATURE_META: Record<
  LandingFeatureKey,
  {
    icon: LucideIcon
    color: string
    titleKey: TranslationKey
    descKey: TranslationKey
    expandedKey: TranslationKey
  }
> = {
  learn: {
    icon: BookOpen,
    color: 'bg-kinder-blue',
    titleKey: 'featureLearnTitle',
    descKey: 'featureLearnDesc',
    expandedKey: 'featureLearnExpanded',
  },
  safe: {
    icon: Shield,
    color: 'bg-kinder-pink',
    titleKey: 'featureSafeTitle',
    descKey: 'featureSafeDesc',
    expandedKey: 'featureSafeExpanded',
  },
  arts: {
    icon: Music,
    color: 'bg-kinder-purple',
    titleKey: 'featureArtsTitle',
    descKey: 'featureArtsDesc',
    expandedKey: 'featureArtsExpanded',
  },
  play: {
    icon: Palette,
    color: 'bg-kinder-green',
    titleKey: 'featurePlayTitle',
    descKey: 'featurePlayDesc',
    expandedKey: 'featurePlayExpanded',
  },
  outdoor: {
    icon: Sun,
    color: 'bg-kinder-yellow',
    titleKey: 'featureOutdoorTitle',
    descKey: 'featureOutdoorDesc',
    expandedKey: 'featureOutdoorExpanded',
  },
  class: {
    icon: Users,
    color: 'bg-kinder-orange',
    titleKey: 'featureClassTitle',
    descKey: 'featureClassDesc',
    expandedKey: 'featureClassExpanded',
  },
}

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    tagline: EMPTY_TEXT,
    headline_start: EMPTY_TEXT,
    headline_highlight: EMPTY_TEXT,
    headline_end: EMPTY_TEXT,
    subtitle: EMPTY_TEXT,
  },
  about: {
    enabled: false,
    founded_year: null,
    story: EMPTY_TEXT,
    approach: EMPTY_TEXT,
    principal_message: EMPTY_TEXT,
    principal_photo_url: null,
    photo_urls: [],
  },
  // 'hidden' by default: the old placeholder numbers were fictional, so a
  // school that has not configured stats should show nothing rather than 500+.
  stats: { mode: 'hidden', students: 0, staff: 0, classes: 0, rating: 0 },
  features: { enabled: [...FEATURE_KEYS] },
  team: { enabled: false, members: [] },
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function mergeText(raw: unknown, fallback: BilingualText): BilingualText {
  if (!isRecord(raw)) return fallback
  return {
    en: typeof raw.en === 'string' ? raw.en : fallback.en,
    ms: typeof raw.ms === 'string' ? raw.ms : fallback.ms,
  }
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

/**
 * Fills a possibly-partial or malformed stored value with defaults so the
 * landing page and Settings panels never have to null-check deep paths.
 */
export function mergeLandingContent(raw: unknown): LandingContent {
  const d = DEFAULT_LANDING_CONTENT
  if (!isRecord(raw)) return d

  const hero = isRecord(raw.hero) ? raw.hero : {}
  const about = isRecord(raw.about) ? raw.about : {}
  const stats = isRecord(raw.stats) ? raw.stats : {}
  const features = isRecord(raw.features) ? raw.features : {}
  const team = isRecord(raw.team) ? raw.team : {}

  const mode = stats.mode
  const statsMode: LandingStats['mode'] =
    mode === 'live' || mode === 'manual' || mode === 'hidden' ? mode : d.stats.mode

  const enabled = Array.isArray(features.enabled)
    ? features.enabled.filter((k): k is LandingFeatureKey =>
        FEATURE_KEYS.includes(k as LandingFeatureKey)
      )
    : d.features.enabled

  const members = Array.isArray(team.members)
    ? team.members.filter(isRecord).map((m) => ({
        id: typeof m.id === 'string' ? m.id : crypto.randomUUID(),
        name: typeof m.name === 'string' ? m.name : '',
        role: mergeText(m.role, EMPTY_TEXT),
        photo_url: typeof m.photo_url === 'string' ? m.photo_url : null,
      }))
    : []

  return {
    hero: {
      tagline: mergeText(hero.tagline, d.hero.tagline),
      headline_start: mergeText(hero.headline_start, d.hero.headline_start),
      headline_highlight: mergeText(hero.headline_highlight, d.hero.headline_highlight),
      headline_end: mergeText(hero.headline_end, d.hero.headline_end),
      subtitle: mergeText(hero.subtitle, d.hero.subtitle),
    },
    about: {
      enabled: about.enabled === true,
      founded_year: typeof about.founded_year === 'number' ? about.founded_year : null,
      story: mergeText(about.story, d.about.story),
      approach: mergeText(about.approach, d.about.approach),
      principal_message: mergeText(about.principal_message, d.about.principal_message),
      principal_photo_url:
        typeof about.principal_photo_url === 'string' ? about.principal_photo_url : null,
      photo_urls: Array.isArray(about.photo_urls)
        ? about.photo_urls.filter((u): u is string => typeof u === 'string')
        : [],
    },
    stats: {
      mode: statsMode,
      students: num(stats.students, 0),
      staff: num(stats.staff, 0),
      classes: num(stats.classes, 0),
      rating: num(stats.rating, 0),
    },
    features: { enabled },
    team: { enabled: team.enabled === true, members },
  }
}

/**
 * Picks the text for the current language. Falls back to English, then to
 * the built-in default so a half-filled form never shows a blank.
 */
export function pickText(text: BilingualText, lang: 'en' | 'ms', fallback: string): string {
  const preferred = text[lang].trim()
  if (preferred) return preferred
  const english = text.en.trim()
  if (english) return english
  return fallback
}

export interface ResolvedStat {
  key: 'students' | 'staff' | 'classes' | 'rating'
  value: number
  suffix: string
  decimals: number
}

/**
 * Turns the stats config into the tiles to render. Zero values are skipped.
 * In live mode student + class counts come from the public stats endpoint;
 * staff and rating are always school-entered because nothing in the database
 * can compute them honestly.
 */
export function resolveStats(stats: LandingStats, live: PublicStats | null): ResolvedStat[] {
  if (stats.mode === 'hidden') return []
  const isLive = stats.mode === 'live'
  const students = isLive ? (live?.students ?? 0) : stats.students
  const classes = isLive ? (live?.classes ?? 0) : stats.classes
  const candidates: ResolvedStat[] = [
    { key: 'students', value: students, suffix: '', decimals: 0 },
    { key: 'staff', value: stats.staff, suffix: '', decimals: 0 },
    { key: 'classes', value: classes, suffix: '', decimals: 0 },
    {
      key: 'rating',
      value: stats.rating,
      suffix: ' ★',
      decimals: Number.isInteger(stats.rating) ? 0 : 1,
    },
  ]
  return candidates.filter((s) => s.value > 0)
}
