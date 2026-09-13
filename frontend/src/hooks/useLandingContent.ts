import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { schoolInfoApi } from '@/lib/api'
import { useSchoolInfo } from '@/hooks/useSchoolInfo'
import { useSettingsStore } from '@/store/settingsStore'
import { useT } from '@/hooks/useT'
import { pickText, resolveStats, FEATURE_META } from '@/lib/landingContent'
import type { ResolvedStat } from '@/lib/landingContent'
import type { LandingFeatureKey, TeamMember } from '@/types'

export interface ResolvedTeamMember extends Omit<TeamMember, 'role'> {
  role: string
}

/**
 * Resolves the school's landing content for the current language, falling
 * back to the built-in copy wherever the school left a field blank.
 * Public (no-auth) — safe to use on the landing page.
 */
export function useLandingContent() {
  const t = useT()
  const lang = useSettingsStore((s) => s.lang)
  const { landingContent, schoolName, principalName, isLoaded } = useSchoolInfo({ public: true })

  const { data: liveStats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => schoolInfoApi.getPublicStats(),
    enabled: landingContent.stats.mode === 'live',
    staleTime: 5 * 60 * 1000,
  })

  return useMemo(() => {
    const { hero, about, stats, features, team } = landingContent
    const pick = (text: { en: string; ms: string }, fallback = '') => pickText(text, lang, fallback)

    const aboutStory = pick(about.story)
    const aboutApproach = pick(about.approach)
    const principalMessage = pick(about.principal_message)
    const aboutHasContent =
      about.enabled && (aboutStory !== '' || principalMessage !== '' || about.founded_year !== null)

    const members: ResolvedTeamMember[] = team.members
      .filter((m) => m.name.trim() !== '')
      .map((m) => ({ ...m, role: pick(m.role) }))

    const statTiles: ResolvedStat[] = resolveStats(stats, liveStats?.data ?? null)

    const featureCards = features.enabled
      .filter((key): key is LandingFeatureKey => key in FEATURE_META)
      .map((key) => ({ key, ...FEATURE_META[key] }))

    return {
      isLoaded,
      schoolName,
      hero: {
        tagline: pick(hero.tagline, t('heroTagline')),
        headlineStart: pick(hero.headline_start, t('heroPart1')),
        headlineHighlight: pick(hero.headline_highlight, t('heroHighlight')),
        headlineEnd: pick(hero.headline_end, t('heroPart2')),
        subtitle: pick(hero.subtitle, t('heroSubtitle')),
      },
      about: {
        show: aboutHasContent,
        foundedYear: about.founded_year,
        story: aboutStory,
        approach: aboutApproach,
        principalName,
        principalMessage,
        principalPhotoUrl: about.principal_photo_url,
        photoUrls: about.photo_urls,
      },
      stats: { show: statTiles.length > 0, tiles: statTiles },
      features: { show: featureCards.length > 0, cards: featureCards },
      team: { show: team.enabled && members.length > 0, members },
    }
  }, [landingContent, lang, liveStats, t, schoolName, principalName, isLoaded])
}
