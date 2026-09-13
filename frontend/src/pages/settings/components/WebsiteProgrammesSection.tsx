import { ArrowUp, ArrowDown, Check } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useLandingSection } from '@/hooks/useLandingSection'
import { FEATURE_KEYS, FEATURE_META } from '@/lib/landingContent'
import { WebsiteSectionCard } from './WebsiteSectionCard'
import type { LandingFeatureKey } from '@/types'

/** Settings > Website > Programmes — pick and order the built-in programme cards. */
export function WebsiteProgrammesSection() {
  const t = useT()
  const { value, update, isDirty, isLoading, hasSchoolInfo, save, isSaving } =
    useLandingSection('features')

  const enabled = value.enabled
  const disabled = FEATURE_KEYS.filter((k) => !enabled.includes(k))

  const toggle = (key: LandingFeatureKey) =>
    update({
      enabled: enabled.includes(key) ? enabled.filter((k) => k !== key) : [...enabled, key],
    })

  const move = (key: LandingFeatureKey, dir: -1 | 1) => {
    const i = enabled.indexOf(key)
    const j = i + dir
    if (i < 0 || j < 0 || j >= enabled.length) return
    const next = [...enabled]
    ;[next[i], next[j]] = [next[j], next[i]]
    update({ enabled: next })
  }

  const row = (key: LandingFeatureKey, index: number, isOn: boolean) => {
    const meta = FEATURE_META[key]
    const Icon = meta.icon
    return (
      <div
        key={key}
        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
          isOn
            ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            : 'border-dashed border-gray-200 dark:border-gray-700 opacity-60'
        }`}
      >
        <button
          type="button"
          onClick={() => toggle(key)}
          aria-pressed={isOn}
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
            isOn
              ? 'bg-kinder-orange border-kinder-orange text-white'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {isOn && <Check size={14} strokeWidth={3} />}
        </button>
        <div
          className={`w-9 h-9 rounded-xl ${meta.color} flex items-center justify-center shrink-0`}
        >
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {t(meta.titleKey)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{t(meta.descKey)}</p>
        </div>
        {isOn && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => move(key, -1)}
              disabled={index === 0}
              aria-label={t('settingsMoveUp')}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-kinder-orange hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-30 transition-colors"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => move(key, 1)}
              disabled={index === enabled.length - 1}
              aria-label={t('settingsMoveDown')}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-kinder-orange hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-30 transition-colors"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <WebsiteSectionCard
      title={t('settingsNavProgrammes')}
      description={t('settingsProgrammesDesc')}
      isLoading={isLoading}
      hasSchoolInfo={hasSchoolInfo}
      isDirty={isDirty}
      isSaving={isSaving}
      onSave={save}
    >
      <div className="space-y-2">
        {enabled.map((key, i) => row(key, i, true))}
        {disabled.map((key) => row(key, -1, false))}
      </div>
      {enabled.length === 0 && (
        <p className="text-xs text-ink-peach bg-wash-peach rounded-xl px-4 py-3 font-semibold">
          {t('settingsProgrammesNone')}
        </p>
      )}
    </WebsiteSectionCard>
  )
}
