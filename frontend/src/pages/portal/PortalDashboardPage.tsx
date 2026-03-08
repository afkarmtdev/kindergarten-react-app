import { useQuery } from '@tanstack/react-query'
import { CalendarCheck2, CalendarX2, Clock, MinusCircle, AlertCircle, Wallet } from 'lucide-react'
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
  present: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  absent: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  late: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  excused: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
}

function formatRM(n: number) {
  return `RM ${n.toFixed(2)}`
}

export default function PortalDashboardPage() {
  usePageTitle('Parent Portal')
  const { student } = useParentAuth()
  const t = useT()

  const today = new Date().toISOString().split('T')[0]

  const { data: attendanceData } = useQuery({
    queryKey: ['portal-attendance', student?.id, { page: 1, limit: 1 }],
    queryFn: () => portalDataApi.getAttendance({ page: 1, limit: 5 }),
    enabled: !!student,
  })

  const { data: feesData } = useQuery({
    queryKey: ['portal-fees', student?.id],
    queryFn: () => portalDataApi.getFees({ page: 1, limit: 5 }),
    enabled: !!student,
  })

  const { data: announcementsData } = useQuery({
    queryKey: ['portal-announcements', student?.id],
    queryFn: () => portalDataApi.getAnnouncements(),
    enabled: !!student,
  })

  const { data: dailyReportData } = useQuery({
    queryKey: ['portal-daily-reports', student?.id, { page: 1, limit: 1 }],
    queryFn: () => portalDataApi.getDailyReports({ limit: 1 }),
    enabled: !!student,
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
  const announcements = (announcementsData?.data as Announcement[] | undefined)?.slice(0, 3) ?? []

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-lg mx-auto">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('portalWelcome')}, {student?.full_name?.split(' ')[0]}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-MY', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Today's attendance */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {t('attendance')} — {t('today') ?? 'Today'}
        </p>
        {todayAttendance ? (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${STATUS_COLOR[todayAttendance.status]}`}
          >
            {(() => {
              const Icon = STATUS_ICON[todayAttendance.status]
              return <Icon className="w-4 h-4" />
            })()}
            <span className="capitalize">{todayAttendance.status}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <AlertCircle className="w-4 h-4" />
            Not recorded yet
          </span>
        )}
      </div>

      {/* Fee balance */}
      {totalOutstanding > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-kinder-orange" />
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
              Outstanding Fees
            </p>
          </div>
          <p className="text-2xl font-bold text-kinder-orange">{formatRM(totalOutstanding)}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
            {unpaidFees.length} unpaid {unpaidFees.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      )}

      {/* Today's daily report */}
      {latestReport && latestReport.report_date === today && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t('todaysReport')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {latestReport.mood && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('mood')}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                  {latestReport.mood}
                </p>
              </div>
            )}
            {latestReport.meals_eaten && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('mealsEaten')}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                  {latestReport.meals_eaten}
                </p>
              </div>
            )}
            {latestReport.nap_minutes != null && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('napMinutes')}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {latestReport.nap_minutes} min
                </p>
              </div>
            )}
            {latestReport.toilet_count != null && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('toiletCount')}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {latestReport.toilet_count}x
                </p>
              </div>
            )}
          </div>
          {latestReport.activity_note && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              {latestReport.activity_note}
            </p>
          )}
        </div>
      )}

      {/* Pinned / latest announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('announcements')}
          </p>
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-gray-900 rounded-xl p-3.5 border border-gray-200 dark:border-gray-800 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</p>
                {a.is_pinned && (
                  <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                    Pinned
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{a.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
