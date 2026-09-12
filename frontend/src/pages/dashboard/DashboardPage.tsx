import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarCheck, School, TrendingUp, Gift, Users, Moon } from 'lucide-react'
import { studentsApi, attendanceApi, classesApi, feesApi } from '@/lib/api'
import { StatCardSkeleton } from '@/components/ui/Skeletons'
import { useT } from '@/hooks/useT'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { StickerBadge } from '@/pages/landing/components/StickerBadge'
import { DoodleSun } from '@/components/landing/doodles/DoodleSun'
import { format } from 'date-fns'
import { StatCard } from './components/StatCard'
import { AttendanceTrendChart } from './components/AttendanceTrendChart'
import { FeeCollectionChart } from './components/FeeCollectionChart'

// Warm Storybook: wash/ink tokens flip automatically between light pastel and dark
// nebula tint, so these pairs intentionally carry no dark: variants.
const STATUS_BADGE: Record<string, string> = {
  present: 'bg-wash-mint text-ink-mint',
  late: 'bg-wash-butter text-ink-butter',
  excused: 'bg-wash-sky text-ink-sky',
  absent: 'bg-wash-blush text-ink-blush',
}

const BAR_COLOR: Record<string, string> = {
  present: 'bg-kinder-green',
  late: 'bg-kinder-yellow',
  excused: 'bg-kinder-blue',
  absent: 'bg-kinder-pink',
}

const SUMMARY_STATUSES = ['present', 'late', 'excused', 'absent'] as const

// Tiny stars scattered across the dark-mode galaxy banner (top / left / size in px)
const BANNER_STARS: { top: string; left: string; size: number }[] = [
  { top: '8%', left: '5%', size: 2 },
  { top: '16%', left: '14%', size: 1 },
  { top: '11%', left: '27%', size: 2 },
  { top: '28%', left: '9%', size: 1 },
  { top: '34%', left: '22%', size: 2 },
  { top: '6%', left: '41%', size: 1 },
  { top: '20%', left: '48%', size: 2 },
  { top: '38%', left: '37%', size: 1 },
  { top: '10%', left: '61%', size: 1 },
  { top: '24%', left: '69%', size: 2 },
  { top: '44%', left: '58%', size: 1 },
  { top: '7%', left: '79%', size: 2 },
  { top: '19%', left: '89%', size: 1 },
  { top: '33%', left: '81%', size: 2 },
  { top: '52%', left: '72%', size: 1 },
  { top: '58%', left: '13%', size: 1 },
]

const formatRM = (v: number) => `RM ${Number(v).toFixed(2)}`

const PANEL_CARD =
  'bg-white dark:bg-gray-900 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-800'
const PANEL_HEADING = 'font-fun font-semibold text-lg text-gray-900 dark:text-white mb-4'

export function DashboardPage() {
  usePageTitle('Dashboard')
  const t = useT()
  const { user } = useAuth()
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])
  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), [])

  const {
    data: studentsCountData,
    isLoading: studentsLoading,
    isError: studentsErr,
  } = useQuery({
    queryKey: ['students-count'],
    queryFn: () => studentsApi.getCount(),
    staleTime: 60_000,
  })

  const {
    data: classesCountData,
    isLoading: classesLoading,
    isError: classesErr,
  } = useQuery({
    queryKey: ['classes-count'],
    queryFn: () => classesApi.getCount(),
    staleTime: 60_000,
  })

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryErr,
  } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: () => attendanceApi.getSummary(),
    staleTime: 30_000,
  })

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['attendance', today, { limit: 10 }],
    queryFn: () => attendanceApi.getByDate(today, { limit: 10 }),
    staleTime: 15_000,
  })

  const {
    data: feesSummary,
    isLoading: feesLoading,
    isError: feesErr,
  } = useQuery({
    queryKey: ['fees-summary', currentMonth],
    queryFn: () => feesApi.getSummary(currentMonth),
    staleTime: 60_000,
  })

  const { data: birthdayData, isError: birthdayErr } = useQuery({
    queryKey: ['students-birthday-check', { status: 'active' }],
    queryFn: () =>
      studentsApi.getAll({ page: 1, limit: 5, birthday_today: true, status: 'active' }),
    staleTime: 5 * 60_000,
  })

  const {
    data: attendanceTrend,
    isLoading: trendLoading,
    isError: trendErr,
  } = useQuery({
    queryKey: ['attendance-trend'],
    queryFn: () => attendanceApi.getTrend(6),
    staleTime: 5 * 60_000,
  })

  const {
    data: feesTrend,
    isLoading: feesTrendLoading,
    isError: feesTrendErr,
  } = useQuery({
    queryKey: ['fees-trend'],
    queryFn: () => feesApi.getTrend(6),
    staleTime: 5 * 60_000,
  })

  // Notify admin when any dashboard RPC query fails
  const errorFlags = [
    studentsErr,
    classesErr,
    summaryErr,
    feesErr,
    birthdayErr,
    trendErr,
    feesTrendErr,
  ]
  const hasError = errorFlags.some(Boolean)
  const toastShown = useRef(false)
  useEffect(() => {
    if (hasError && !toastShown.current) {
      toastShown.current = true
      toast.error('Some dashboard data failed to load. Try refreshing the page.')
    }
    if (!hasError) toastShown.current = false
  }, [hasError])

  const birthdayStudents = birthdayData?.data ?? []
  const birthdayTotal = birthdayData?.meta?.total ?? 0

  const totalStudents = studentsCountData?.count ?? 0
  const totalClasses = classesCountData?.count ?? 0
  const todayRecords: { id: string; status: string; students?: { full_name: string } }[] =
    todayData?.data ?? []
  const presentToday = todayRecords.filter((r) => r.status === 'present').length

  const totalPresent = (summary?.present ?? 0) + (summary?.late ?? 0)
  const totalRecords = summary
    ? (summary.present ?? 0) + (summary.absent ?? 0) + (summary.late ?? 0) + (summary.excused ?? 0)
    : 0
  const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0

  const statsLoading = studentsLoading || classesLoading || todayLoading

  const greetingKey = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'greetingMorning' as const
    if (hour < 18) return 'greetingAfternoon' as const
    return 'greetingEvening' as const
  }, [])
  const greetingName = user?.email?.split('@')[0] || t('admin')

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-wash-sky rounded-3xl px-6 py-6 md:px-8 md:py-7">
        {/* Dark mode galaxy */}
        <div
          className="hidden dark:block absolute inset-0"
          aria-hidden="true"
          style={{
            background: 'linear-gradient(135deg,#111827 0%,#1E1B4B 55%,#0F172A 100%)',
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: '62%',
              width: 320,
              height: 320,
              transform: 'translate(-50%,-50%)',
              background: 'radial-gradient(circle, rgba(124,58,237,0.30), transparent 70%)',
            }}
          />
          {BANNER_STARS.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white opacity-50"
              style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
            />
          ))}
        </div>

        {/* Doodle — sun in light, moon in dark */}
        <div className="absolute right-4 top-3 md:right-10 md:top-4 pointer-events-none">
          <DoodleSun size={56} className="block dark:hidden opacity-90" />
          <Moon
            size={40}
            className="hidden dark:block text-kinder-yellow fill-kinder-yellow opacity-90"
          />
        </div>

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-start gap-2">
            <StickerBadge rotate={-3}>{format(new Date(), 'EEEE, d MMMM')}</StickerBadge>
            <h1 className="font-fun font-bold text-2xl md:text-3xl text-gray-900 dark:text-white leading-tight">
              {t(greetingKey, { name: greetingName })}
            </h1>
            <p className="text-sm md:text-[15px] font-semibold text-gray-600 dark:text-gray-300">
              {t('childrenInToday', { present: presentToday, total: totalStudents })}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            <Link
              to="/admin/daily-reports"
              className="text-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-bold text-sm px-5 py-3 rounded-full border-2 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              {t('dailyReports')}
            </Link>
            <Link
              to="/admin/attendance"
              className="text-center bg-kinder-orange text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg shadow-kinder-orange/30 hover:bg-orange-600 transition-colors"
            >
              {t('attendance')}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={Users}
              label={t('totalStudents')}
              value={totalStudents}
              color="bg-kinder-blue"
              sub={`/ ${t('enrolled')}`}
            />
            <StatCard
              icon={School}
              label={t('classes')}
              value={totalClasses}
              color="bg-kinder-purple"
              sub={`/ ${t('active')}`}
            />
            <StatCard
              icon={CalendarCheck}
              label={t('presentToday')}
              value={presentToday}
              color="bg-kinder-green"
              sub={`/ ${totalStudents}`}
            />
            <StatCard
              icon={TrendingUp}
              label={t('attendanceRate')}
              value={`${attendanceRate}%`}
              color="bg-kinder-orange"
              sub={`/ ${t('thisMonth')}`}
            />
          </>
        )}
      </div>

      {/* Fee summary — inline row, not a card-in-card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {feesLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-3xl bg-gray-100 dark:bg-gray-800 animate-shimmer bg-[length:200%_100%]"
            />
          ))
        ) : (
          <>
            <div className="rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 px-4 py-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide">
                {t('totalCharged')}
              </p>
              <p className="font-fun font-semibold text-xl text-gray-900 dark:text-white tabular-nums mt-1">
                {formatRM(feesSummary?.total_owed ?? 0)}
              </p>
            </div>
            <div className="rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 px-4 py-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide">
                {t('totalCollected')}
              </p>
              <p className="font-fun font-semibold text-xl text-ink-mint tabular-nums mt-1">
                {formatRM(feesSummary?.total_paid ?? 0)}
              </p>
            </div>
            <div className="rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 px-4 py-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide">
                {t('outstanding')}
              </p>
              <p className="font-fun font-semibold text-xl text-ink-peach tabular-nums mt-1">
                {formatRM(feesSummary?.total_outstanding ?? 0)}
              </p>
            </div>
            <div className="rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 px-4 py-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide">
                {t('overdueCount')}
              </p>
              <p className="font-fun font-semibold text-xl text-ink-blush tabular-nums mt-1">
                {feesSummary?.overdue_count ?? 0}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceTrendChart data={attendanceTrend ?? []} loading={trendLoading} />
        <FeeCollectionChart data={feesTrend ?? []} loading={feesTrendLoading} />
      </div>

      {/* Bottom panels */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Attendance */}
        <div className={PANEL_CARD}>
          <h2 className={PANEL_HEADING}>{t('todayAttendance')}</h2>
          {todayLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-1/2 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full w-16 animate-shimmer bg-[length:200%_100%]" />
                </div>
              ))}
            </div>
          ) : todayRecords.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CalendarCheck size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">{t('noAttendanceYet')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {todayRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-bold">
                    {record.students?.full_name}
                  </span>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-full font-extrabold ${STATUS_BADGE[record.status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                  >
                    {t(record.status as 'present' | 'absent' | 'late' | 'excused')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Birthdays */}
        <div className={PANEL_CARD}>
          <h2 className={PANEL_HEADING}>{t('todaysBirthdays')}</h2>
          {birthdayStudents.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Gift size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">{t('noBirthdaysToday')}</p>
              <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">{t('noBirthdaysSub')}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {birthdayStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 bg-wash-butter rounded-2xl p-3"
                  title={t('birthdayToday')}
                >
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.full_name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-fun font-bold text-sm text-ink-butter">
                        {student.full_name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                      {student.full_name}
                    </p>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">
                      {student.class_name}
                    </p>
                  </div>
                  <StickerBadge rotate={6} className="flex-shrink-0">
                    {t('birthdayBadge')}
                  </StickerBadge>
                </div>
              ))}
              {birthdayTotal > birthdayStudents.length && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                  {t('andMoreBirthdays', { n: birthdayTotal - birthdayStudents.length })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Monthly Summary */}
        <div className={PANEL_CARD}>
          <h2 className={PANEL_HEADING}>{t('monthlySummary')}</h2>
          {summaryLoading ? (
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-8 animate-shimmer bg-[length:200%_100%]" />
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full animate-shimmer bg-[length:200%_100%]" />
                </div>
              ))}
            </div>
          ) : !summary || totalRecords === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">{t('noDataYet')}</p>
              <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">{t('noDataYetSub')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {SUMMARY_STATUSES.map((status) => {
                const count = (summary as Record<string, number>)[status] ?? 0
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="capitalize font-bold text-gray-700 dark:text-gray-300">
                        {t(status)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 font-bold">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${BAR_COLOR[status]}`}
                        style={{ width: `${(count / totalRecords) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
