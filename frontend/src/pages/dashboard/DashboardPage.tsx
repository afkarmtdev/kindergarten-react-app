import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarCheck, School, TrendingUp, Gift, Wallet, Users } from 'lucide-react'
import { studentsApi, attendanceApi, classesApi, feesApi } from '@/lib/api'
import { StatCardSkeleton } from '@/components/ui/Skeletons'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { format } from 'date-fns'
import { StatCard } from './components/StatCard'
import { AttendanceTrendChart } from './components/AttendanceTrendChart'
import { FeeCollectionChart } from './components/FeeCollectionChart'

const STATUS_BADGE: Record<string, string> = {
  present: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  late: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  excused: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const BAR_COLOR: Record<string, string> = {
  present: 'bg-kinder-green',
  late: 'bg-kinder-yellow',
  excused: 'bg-kinder-blue',
  absent: 'bg-red-400',
}

const SUMMARY_STATUSES = ['present', 'late', 'excused', 'absent'] as const

const formatRM = (v: number) => `RM ${Number(v).toFixed(2)}`

export function DashboardPage() {
  usePageTitle('Dashboard')
  const t = useT()
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

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          {t('dashboard')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={Users}
              label={t('totalStudents')}
              value={totalStudents}
              color="bg-kinder-blue"
              sub={t('enrolled')}
            />
            <StatCard
              icon={School}
              label={t('classes')}
              value={totalClasses}
              color="bg-kinder-purple"
              sub={t('active')}
            />
            <StatCard
              icon={CalendarCheck}
              label={t('presentToday')}
              value={presentToday}
              color="bg-kinder-green"
              sub={t('ofStudents', { n: totalStudents })}
            />
            <StatCard
              icon={TrendingUp}
              label={t('attendanceRate')}
              value={`${attendanceRate}%`}
              color="bg-kinder-orange"
              sub={t('thisMonth')}
            />
          </>
        )}
      </div>

      {/* Fee Collection Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-kinder-orange rounded-xl flex items-center justify-center flex-shrink-0">
            <Wallet size={16} className="text-white" />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100">
            {t('feeCollection')}
            <span className="ml-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
              {currentMonth}
            </span>
          </h2>
        </div>
        {feesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-shimmer bg-[length:200%_100%]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-1">
                {t('totalCharged')}
              </p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">
                {formatRM(feesSummary?.total_owed ?? 0)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-1">
                {t('totalCollected')}
              </p>
              <p className="text-xl font-extrabold text-kinder-green tabular-nums">
                {formatRM(feesSummary?.total_paid ?? 0)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-1">
                {t('outstanding')}
              </p>
              <p className="text-xl font-extrabold text-kinder-orange tabular-nums">
                {formatRM(feesSummary?.total_outstanding ?? 0)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-1">
                {t('overdueCount')}
              </p>
              <p className="text-xl font-extrabold text-red-500 tabular-nums">
                {feesSummary?.overdue_count ?? 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AttendanceTrendChart data={attendanceTrend ?? []} loading={trendLoading} />
        <FeeCollectionChart data={feesTrend ?? []} loading={feesTrendLoading} />
      </div>

      {/* Bottom panels */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Attendance */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-kinder-green rounded-xl flex items-center justify-center flex-shrink-0">
              <CalendarCheck size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('todayAttendance')}</h2>
          </div>
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
              <CalendarCheck size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">{t('noAttendanceYet')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {todayRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {record.students?.full_name}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE[record.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {t(record.status as 'present' | 'absent' | 'late' | 'excused')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Birthdays */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-kinder-yellow rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('todaysBirthdays')}</h2>
          </div>
          {birthdayStudents.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Gift size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">{t('noBirthdaysToday')}</p>
              <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">{t('noBirthdaysSub')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {birthdayStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.full_name}
                      className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-kinder-yellow rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">{student.full_name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{student.class_name}</p>
                  </div>
                  <span className="text-xs bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    {t('birthdayToday')}
                  </span>
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-kinder-blue rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('monthlySummary')}</h2>
          </div>
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
              <TrendingUp size={32} className="mx-auto mb-2 opacity-40" />
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
                      <span className="capitalize font-semibold text-gray-700 dark:text-gray-300">
                        {t(status)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${BAR_COLOR[status]}`}
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
