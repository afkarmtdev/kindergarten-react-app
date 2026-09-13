import { Star } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useLandingSection } from '@/hooks/useLandingSection'
import { useSettingsStore } from '@/store/settingsStore'
import { translations } from '@/lib/translations'
import { pickText } from '@/lib/landingContent'
import { WebsiteSectionCard } from './WebsiteSectionCard'
import { BilingualField } from './BilingualField'

/** Settings > Website > Hero Copy — the tagline, headline and subtitle in the school's words. */
export function WebsiteHeroSection() {
  const t = useT()
  const lang = useSettingsStore((s) => s.lang)
  const { value, update, isDirty, isLoading, hasSchoolInfo, save, isSaving } =
    useLandingSection('hero')

  const en = translations.en
  const ms = translations.ms
  const preview = {
    tagline: pickText(value.tagline, lang, t('heroTagline')),
    start: pickText(value.headline_start, lang, t('heroPart1')),
    highlight: pickText(value.headline_highlight, lang, t('heroHighlight')),
    end: pickText(value.headline_end, lang, t('heroPart2')),
    subtitle: pickText(value.subtitle, lang, t('heroSubtitle')),
  }

  return (
    <WebsiteSectionCard
      title={t('settingsNavHero')}
      description={t('settingsHeroDesc')}
      isLoading={isLoading}
      hasSchoolInfo={hasSchoolInfo}
      isDirty={isDirty}
      isSaving={isSaving}
      onSave={save}
    >
      {/* Live preview */}
      <div className="rounded-2xl bg-wash-peach px-5 py-6 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-peach mb-3">
          {t('settingsHeroPreview')}
        </p>
        <span className="inline-flex items-center gap-1.5 bg-kinder-yellow text-gray-900 border-2 border-white dark:border-gray-900 px-3 py-1 rounded-full font-fun text-xs font-bold mb-3">
          <Star size={11} fill="#FF6B35" stroke="#FF6B35" />
          {preview.tagline}
        </span>
        <p className="font-fun font-bold text-2xl text-gray-900 dark:text-white leading-tight">
          {preview.start} <span className="text-kinder-orange">{preview.highlight}</span>{' '}
          {preview.end}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-md mx-auto">
          {preview.subtitle}
        </p>
      </div>

      <BilingualField
        label={t('settingsHeroTagline')}
        value={value.tagline}
        onChange={(tagline) => update({ tagline })}
        placeholderEn={en.heroTagline}
        placeholderMs={ms.heroTagline}
      />
      <BilingualField
        label={t('settingsHeroHeadlineStart')}
        value={value.headline_start}
        onChange={(headline_start) => update({ headline_start })}
        placeholderEn={en.heroPart1}
        placeholderMs={ms.heroPart1}
      />
      <BilingualField
        label={t('settingsHeroHeadlineHighlight')}
        value={value.headline_highlight}
        onChange={(headline_highlight) => update({ headline_highlight })}
        placeholderEn={en.heroHighlight}
        placeholderMs={ms.heroHighlight}
      />
      <BilingualField
        label={t('settingsHeroHeadlineEnd')}
        value={value.headline_end}
        onChange={(headline_end) => update({ headline_end })}
        placeholderEn={en.heroPart2}
        placeholderMs={ms.heroPart2}
      />
      <BilingualField
        label={t('settingsHeroSubtitle')}
        value={value.subtitle}
        onChange={(subtitle) => update({ subtitle })}
        placeholderEn={en.heroSubtitle}
        placeholderMs={ms.heroSubtitle}
        multiline
        hint={t('settingsBlankKeepsDefault')}
      />
    </WebsiteSectionCard>
  )
}
