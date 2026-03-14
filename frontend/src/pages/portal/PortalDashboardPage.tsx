import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import {
  CalendarCheck2,
  CalendarX2,
  Clock,
  MinusCircle,
  AlertCircle,
  Wallet,
  Megaphone,
  ClipboardList,
  Sun,
  Moon,
  Utensils,
  BedDouble,
  Bath,
  SmilePlus,
  Pin,
} from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { AttendanceRecord, FeeRecord, Announcement, DailyReport } from '../../types'

const STATUS_ICON = {
  present: CalendarCheck2,
  absent: CalendarX2,
  late: Clock,
  excused: MinusCircle,
}
const STATUS_COLOR = {
  present:
    'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  absent:
    'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  late: 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  excused:
    'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
}

const CATEGORY_DOT: Record<string, string> = {
  general: 'bg-gray-400',
  holiday: 'bg-kinder-green',
  event: 'bg-kinder-purple',
  reminder: 'bg-kinder-orange',
}

const MOOD_ICON: Record<string, React.ElementType> = {
  happy: SmilePlus,
  okay: Sun,
  tired: Moon,
  upset: AlertCircle,
}

function formatRM(n: number) {
  return `RM ${n.toFixed(2)}`
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function PortalDashboardPage() {
  usePageTitle('Parent Portal')
  const { parent, selectedChild } = useParentAuth()
  const t = useT()

  const [heroVisible, setHeroVisible] = useState(false)
  useEffect(() => {
    setHeroVisible(true)
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const dateString = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const { data: attendanceData, isFetching: isRefreshing } = useQuery({
    queryKey: ['portal-attendance', selectedChild?.id, { page: 1, limit: 1 }],
    queryFn: () =>
      portalDataApi.getAttendance({ page: 1, limit: 5, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
  })

  const { data: feesData } = useQuery({
    queryKey: ['portal-fees', selectedChild?.id],
    queryFn: () => portalDataApi.getFees({ page: 1, limit: 5, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
  })

  const { data: announcementsData } = useQuery({
    queryKey: ['portal-announcements', parent?.id],
    queryFn: () => portalDataApi.getAnnouncements(),
    enabled: !!parent,
  })

  const { data: dailyReportData } = useQuery({
    queryKey: ['portal-daily-reports', selectedChild?.id, { page: 1, limit: 1 }],
    queryFn: () => portalDataApi.getDailyReports({ limit: 1, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
  })

  const todayAttendance = (attendanceData?.data as AttendanceRecord[] | undefined)?.find(
    (r) => r.date === today
  )

  const unpaidFees = ((feesData?.data as FeeRecord[] | undefined) ?? []).filter(
    (f) => f.status === 'unpaid' || f.status === 'partial'
  )
  const totalOutstanding = unpaidFees.reduce(
    (sum, f) => sum + (f.amount_owed - f.amount_paid - f.discount_amount),
    0
  )

  const latestReport = (dailyReportData?.data as DailyReport[] | undefined)?.[0]
  const todayReport = latestReport && latestReport.report_date === today ? latestReport : null

  const announcements = (announcementsData?.data as Announcement[] | undefined)?.slice(0, 3) ?? []

  const MoodIcon = todayReport?.mood ? (MOOD_ICON[todayReport.mood] ?? SmilePlus) : SmilePlus

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-lg mx-auto">
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center gap-2 py-1.5 text-[10px] font-semibold text-kinder-orange">
          <div className="w-3 h-3 border-2 border-kinder-orange border-t-transparent rounded-full animate-spin" />
          Refreshing...
        </div>
      )}
      {/* Hero section */}
      <div
        className={`bg-gradient-to-br from-kinder-orange to-orange-400 dark:from-kinder-orange/90 dark:to-orange-500/80 rounded-2xl p-5 shadow-sm transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      >
        <div className="flex items-center gap-4">
          {selectedChild?.photo_url ? (
            <img
              src={selectedChild.photo_url}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 ring-2 ring-white/20 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border-2 border-white/30">
              {selectedChild?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm text-white/80 font-medium">{getGreeting()}!</p>
            <h2 className="text-lg font-bold text-white leading-tight truncate">
              {selectedChild?.full_name ?? parent?.full_name?.split(' ')[0]}
            </h2>
            <p className="text-xs text-white/70 mt-0.5">{dateString}</p>
            {selectedChild?.class_name && (
              <span className="inline-block mt-1.5 text-[11px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                {selectedChild.class_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Attendance today */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">
            {t('attendance')}
          </p>
          {todayAttendance ? (
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold ${STATUS_COLOR[todayAttendance.status]}`}
            >
              {(() => {
                const Icon = STATUS_ICON[todayAttendance.status]
                return <Icon className="w-3.5 h-3.5" />
              })()}
              <span className="capitalize">{todayAttendance.status}</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Not marked
            </span>
          )}
        </div>

        {/* Outstanding fees */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">
            Fees
          </p>
          {totalOutstanding > 0 ? (
            <div>
              <p className="text-sm font-bold text-kinder-orange leading-none">
                {formatRM(totalOutstanding)}
              </p>
              <p className="text-[10px] text-orange-500 dark:text-orange-400 mt-0.5">
                {unpaidFees.length} unpaid
              </p>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
              <Wallet className="w-3.5 h-3.5" />
              All paid
            </span>
          )}
        </div>
      </div>

      {/* Today's daily report */}
      {todayReport ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <ClipboardList className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('todaysReport')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {todayReport.mood && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-kinder-yellow/10 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                  <MoodIcon className="w-4 h-4 text-kinder-yellow" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('mood')}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize leading-tight">
                    {todayReport.mood}
                  </p>
                </div>
              </div>
            )}
            {todayReport.meals_eaten && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-kinder-green/10 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-4 h-4 text-kinder-green" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('mealsEaten')}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize leading-tight">
                    {todayReport.meals_eaten}
                  </p>
                </div>
              </div>
            )}
            {todayReport.nap_minutes != null && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-kinder-blue/10 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <BedDouble className="w-4 h-4 text-kinder-blue" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('napMinutes')}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                    {todayReport.nap_minutes} min
                  </p>
                </div>
              </div>
            )}
            {todayReport.toilet_count != null && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-kinder-purple/10 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                  <Bath className="w-4 h-4 text-kinder-purple" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('toiletCount')}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                    {todayReport.toilet_count}x
                  </p>
                </div>
              </div>
            )}
          </div>
          {todayReport.activity_note && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 leading-relaxed">
              {todayReport.activity_note}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('todaysReport')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">No report today</p>
          </div>
        </div>
      )}

      {/* Latest announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-0.5">
            <Megaphone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('announcements')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {announcements.map((a, idx) => (
              <div
                key={a.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < announcements.length - 1
                    ? 'border-b border-gray-100 dark:border-gray-800'
                    : ''
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[a.category] ?? 'bg-gray-400'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {a.title}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(a.created_at).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                {a.is_pinned && (
                  <Pin className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
