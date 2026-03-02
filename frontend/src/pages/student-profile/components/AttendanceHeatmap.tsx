import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subWeeks, startOfWeek, addDays } from 'date-fns'
import { attendanceApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import type { AttendanceRecord } from '@/types'
import { type Status } from '../constants'

const WEEKS = 12
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

const CELL_COLORS: Record<Status | 'none', string> = {
  present: 'bg-green-400 dark:bg-green-500',
  absent: 'bg-red-400 dark:bg-red-500',
  late: 'bg-yellow-400 dark:bg-yellow-500',
  excused: 'bg-blue-400 dark:bg-blue-500',
  none: 'bg-gray-100 dark:bg-gray-700',
}

const LEGEND_ITEMS: [Status | 'none', string][] = [
  ['present', 'bg-green-400'],
  ['absent', 'bg-red-400'],
  ['late', 'bg-yellow-400'],
  ['excused', 'bg-blue-400 dark:bg-blue-500'],
  ['none', 'bg-gray-100 dark:bg-gray-700'],
]

export function AttendanceHeatmap({ studentId }: { studentId: string }) {
  const t = useT()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const startDate = useMemo(
    () => startOfWeek(subWeeks(today, WEEKS - 1), { weekStartsOn: 1 }),
    [today]
  )

  const fromStr = format(startDate, 'yyyy-MM-dd')
  const toStr = format(today, 'yyyy-MM-dd')

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-heatmap', studentId, fromStr],
    queryFn: () =>
      attendanceApi.getByStudent(studentId, { from: fromStr, to: toStr, limit: 100, page: 1 }),
    enabled: !!studentId,
    staleTime: 30_000,
  })

  const statusMap = useMemo(() => {
    const map: Record<string, Status> = {}
    for (const record of (data?.data ?? []) as AttendanceRecord[]) {
      map[record.date] = record.status as Status
    }
    return map
  }, [data])

  const weeks = useMemo(() => {
    let prevMonth = -1
    return Array.from({ length: WEEKS }, (_, w) => {
      const weekStart = addDays(startDate, w * 7)
      const days = Array.from({ length: 7 }, (_, d) => addDays(weekStart, d))
      const month = weekStart.getMonth()
      const monthLabel = month !== prevMonth ? format(weekStart, 'MMM') : ''
      prevMonth = month
      return { week: w, days, monthLabel }
    })
  }, [startDate])

  const todayStr = toStr

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{t('attendanceHeatmap')}</h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t('last12Weeks')}</p>

      {isLoading ? (
        <div className="flex ml-9 gap-1">
          {Array.from({ length: WEEKS }).map((_, w) => (
            <div key={w} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, d) => (
                <div
                  key={d}
                  className="h-4 w-4 rounded-sm bg-gray-200 dark:bg-gray-700 animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Month labels row */}
            <div className="flex ml-9 gap-1 mb-1">
              {weeks.map(({ week, monthLabel }) => (
                <div
                  key={week}
                  className="w-4 text-xs text-gray-400 dark:text-gray-500 font-medium overflow-visible whitespace-nowrap"
                >
                  {monthLabel}
                </div>
              ))}
            </div>

            {/* Day labels + week columns */}
            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-1 w-8">
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="h-4 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-end pr-1"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map(({ week, days }) => (
                <div key={week} className="flex flex-col gap-1">
                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const isFuture = dateStr > todayStr
                    const status = isFuture ? undefined : statusMap[dateStr]
                    const colorClass = isFuture
                      ? 'opacity-0 pointer-events-none'
                      : CELL_COLORS[status ?? 'none']
                    const title = isFuture
                      ? undefined
                      : status
                        ? `${format(day, 'EEE, dd MMM yyyy')} — ${status}`
                        : format(day, 'EEE, dd MMM yyyy')

                    return (
                      <div
                        key={dateStr}
                        title={title}
                        className={`h-4 w-4 rounded-sm ${colorClass} hover:opacity-70 cursor-default transition-opacity`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 flex-wrap ml-9">
              {LEGEND_ITEMS.map(([key, color]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`h-3 w-3 rounded-sm ${color}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {key === 'none' ? t('noRecord') : t(key as Status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
