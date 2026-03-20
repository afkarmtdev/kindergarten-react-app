import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Smile,
  Meh,
  Coffee,
  Frown,
  HelpCircle,
  Utensils,
  Moon,
  Droplets,
  ClipboardList,
} from 'lucide-react'
import { format } from 'date-fns'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { DailyReport } from '../../types'

const MOOD_CONFIG = {
  happy: {
    icon: Smile,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: 'Happy',
  },
  okay: {
    icon: Meh,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Okay',
  },
  tired: {
    icon: Coffee,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Tired',
  },
  upset: {
    icon: Frown,
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'Upset',
  },
}

const MEALS_LABEL: Record<string, string> = {
  all: 'All',
  most: 'Most',
  some: 'Some',
  none: 'None',
}

const today = new Date()
const last7Days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today)
  d.setDate(d.getDate() - (6 - i))
  return d
})

export default function PortalDailyReportPage() {
  usePageTitle('Daily Reports')
  const { selectedChild } = useParentAuth()
  const t = useT()

  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'))

  const { data, isLoading } = useQuery({
    queryKey: ['portal-daily-reports', selectedChild?.id, { limit: 30 }],
    queryFn: () => portalDataApi.getDailyReports({ limit: 30, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
  })

  const reports: DailyReport[] = data?.data ?? []
  const report = reports.find((r) => r.report_date === selectedDate) ?? null

  const moodCfg = report?.mood ? MOOD_CONFIG[report.mood as keyof typeof MOOD_CONFIG] : null
  const MoodIcon = moodCfg?.icon ?? HelpCircle

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dailyReports')}</h2>
      </div>

      {/* Date navigation pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {last7Days.map((d) => {
          const dateStr = format(d, 'yyyy-MM-dd')
          const isSelected = dateStr === selectedDate
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[52px] text-sm font-semibold transition-colors duration-150 border shrink-0 ${
                isSelected
                  ? 'bg-kinder-orange text-white border-kinder-orange'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="text-xs leading-tight">{format(d, 'EEE')}</span>
              <span className="text-base leading-tight">{format(d, 'd')}</span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      ) : !report ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {t('noReportToday')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mood section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col items-center gap-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                moodCfg ? moodCfg.bg : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <MoodIcon
                className={`w-8 h-8 ${moodCfg ? moodCfg.color : 'text-gray-400 dark:text-gray-500'}`}
              />
            </div>
            <p
              className={`text-sm font-semibold ${moodCfg ? moodCfg.color : 'text-gray-400 dark:text-gray-500'}`}
            >
              {moodCfg ? moodCfg.label : 'No mood recorded'}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center gap-1.5">
              <Utensils className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('mealsEaten')}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {report.meals_eaten
                  ? (MEALS_LABEL[report.meals_eaten] ?? report.meals_eaten)
                  : '--'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center gap-1.5">
              <Moon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('napMinutes')}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {report.nap_minutes != null ? `${report.nap_minutes} min` : '--'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 text-center flex flex-col items-center gap-1.5">
              <Droplets className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('toiletCount')}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {report.toilet_count != null ? report.toilet_count : '--'}
              </p>
            </div>
          </div>

          {/* Activity note */}
          {report.activity_note && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {report.activity_note}
              </p>
            </div>
          )}

          {/* Photo */}
          {report.photo_url && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
              <img
                src={report.photo_url}
                alt="Activity"
                className="w-full object-cover rounded-2xl"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
