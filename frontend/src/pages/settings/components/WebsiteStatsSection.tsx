import { useQuery } from '@tanstack/react-query'
import { useT } from '@/hooks/useT'
import { useLandingSection } from '@/hooks/useLandingSection'
import { schoolInfoApi } from '@/lib/api'
import { WebsiteSectionCard } from './WebsiteSectionCard'
import type { LandingStatsMode } from '@/types'

const LABEL_CLS = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1'
const INPUT_CLS =
  'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange disabled:opacity-50'

/** Settings > Website > Numbers — where the stats strip gets its figures. */
export function WebsiteStatsSection() {
  const t = useT()
  const { value, update, isDirty, isLoading, hasSchoolInfo, save, isSaving } =
    useLandingSection('stats')

  const { data: live } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => schoolInfoApi.getPublicStats(),
    enabled: value.mode === 'live',
    staleTime: 60 * 1000,
  })

  const isLive = value.mode === 'live'
  const isHidden = value.mode === 'hidden'

  const modes: { key: LandingStatsMode; label: string; hint?: string }[] = [
    { key: 'live', label: t('settingsStatsModeLive'), hint: t('settingsStatsModeLiveHint') },
    { key: 'manual', label: t('settingsStatsModeManual') },
    { key: 'hidden', label: t('settingsStatsModeHidden') },
  ]

  const numberField = (
    key: 'students' | 'staff' | 'classes',
    label: string,
    liveValue?: number
  ) => (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <input
        type="number"
        min={0}
        value={isLive && liveValue !== undefined ? liveValue : value[key]}
        disabled={isHidden || (isLive && liveValue !== undefined)}
        onChange={(e) => update({ [key]: Math.max(0, Number(e.target.value) || 0) })}
        className={INPUT_CLS}
      />
      {isLive && liveValue !== undefined && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {t('settingsStatsLiveValue', { n: liveValue })}
        </p>
      )}
    </div>
  )

  return (
    <WebsiteSectionCard
      title={t('settingsNavStats')}
      description={t('settingsStatsDesc')}
      isLoading={isLoading}
      hasSchoolInfo={hasSchoolInfo}
      isDirty={isDirty}
      isSaving={isSaving}
      onSave={save}
    >
      <div>
        <p className={LABEL_CLS}>{t('settingsStatsMode')}</p>
        <div className="space-y-2">
          {modes.map((m) => (
            <label
              key={m.key}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                value.mode === m.key
                  ? 'border-kinder-orange bg-orange-50 dark:bg-orange-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="stats-mode"
                checked={value.mode === m.key}
                onChange={() => update({ mode: m.key })}
                className="mt-1 accent-kinder-orange"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {m.label}
                </span>
                {m.hint && (
                  <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {m.hint}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-4 ${isHidden ? 'opacity-50' : ''}`}>
        {numberField('students', t('settingsStatsStudents'), live?.data.students)}
        {numberField('classes', t('settingsStatsClasses'), live?.data.classes)}
        {numberField('staff', t('settingsStatsStaff'))}
        <div>
          <label className={LABEL_CLS}>{t('settingsStatsRating')}</label>
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={value.rating}
            disabled={isHidden}
            onChange={(e) =>
              update({ rating: Math.min(5, Math.max(0, Number(e.target.value) || 0)) })
            }
            className={INPUT_CLS}
          />
        </div>
      </div>
    </WebsiteSectionCard>
  )
}
