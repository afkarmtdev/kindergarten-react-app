import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Smile, Meh, Coffee, Frown } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { DailyReport } from '../../types'

const MOOD_ICON = {
  happy: { icon: Smile, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  okay: { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  tired: { icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  upset: { icon: Frown, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
}

const MEALS_LABEL: Record<string, string> = {
  all: 'Finished all',
  most: 'Ate most',
  some: 'Ate some',
  none: 'Did not eat',
}

export default function PortalDailyReportPage() {
  usePageTitle('Daily Reports')
  const { selectedChild } = useParentAuth()
  const t = useT()

  const { data, isLoading } = useQuery({
    queryKey: ['portal-daily-reports', selectedChild?.id, { limit: 30 }],
    queryFn: () => portalDataApi.getDailyReports({ limit: 30, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
  })

  const reports: DailyReport[] = data?.data ?? []

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dailyReports')}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">{t('noReportToday')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Activity reports will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const moodCfg = r.mood ? MOOD_ICON[r.mood] : null
            const MoodIcon = moodCfg?.icon

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {new Date(r.report_date + 'T00:00:00').toLocaleDateString('en-MY', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  {moodCfg && MoodIcon && (
                    <span
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl ${moodCfg.bg} ${moodCfg.color}`}
                    >
                      <MoodIcon className="w-3.5 h-3.5" />
                      <span className="capitalize">{r.mood}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  {r.meals_eaten && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2 text-center">
                      <p className="text-gray-400 dark:text-gray-500 mb-0.5">{t('mealsEaten')}</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {MEALS_LABEL[r.meals_eaten] ?? r.meals_eaten}
                      </p>
                    </div>
                  )}
                  {r.nap_minutes != null && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2 text-center">
                      <p className="text-gray-400 dark:text-gray-500 mb-0.5">{t('napMinutes')}</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {r.nap_minutes} min
                      </p>
                    </div>
                  )}
                  {r.toilet_count != null && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2 text-center">
                      <p className="text-gray-400 dark:text-gray-500 mb-0.5">{t('toiletCount')}</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        {r.toilet_count}x
                      </p>
                    </div>
                  )}
                </div>

                {r.activity_note && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {r.activity_note}
                  </p>
                )}

                {r.photo_url && (
                  <img
                    src={r.photo_url}
                    alt="Activity"
                    className="w-full h-40 object-cover rounded-xl mt-3"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
