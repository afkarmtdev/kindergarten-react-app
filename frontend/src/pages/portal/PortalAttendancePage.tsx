import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isToday,
  isFuture,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { AttendanceRecord } from '../../types'

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const STATUS_CELL: Record<string, string> = {
  present: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  late: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  excused: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
}

const STATUS_BAR: Record<string, string> = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  late: 'bg-yellow-400',
  excused: 'bg-blue-500',
}

const STATUS_LEGEND: Record<string, string> = {
  present: 'text-green-700 dark:text-green-400',
  absent: 'text-red-700 dark:text-red-400',
  late: 'text-yellow-700 dark:text-yellow-500',
  excused: 'text-blue-700 dark:text-blue-400',
}

const STATUS_BADGE: Record<string, string> = {
  present: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  late: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  excused: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
}

export default function PortalAttendancePage() {
  usePageTitle('Attendance')
  const { selectedChild } = useParentAuth()
  const t = useT()
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const monthStr = format(currentMonth, 'yyyy-MM')

  const { data, isLoading } = useQuery({
    queryKey: ['portal-attendance', selectedChild?.id, monthStr],
    queryFn: () =>
      portalDataApi.getAttendance({ page: 1, limit: 100, student_id: selectedChild?.id }),
    enabled: !!selectedChild,
    placeholderData: (prev) => prev,
  })

  const allRecords: AttendanceRecord[] = data?.data ?? []

  // Filter to records that fall within the current month
  const records = allRecords.filter((r) => r.date.startsWith(monthStr))

  // Build a lookup map: date string (yyyy-MM-dd) → record
  const recordMap = new Map<string, AttendanceRecord>()
  for (const r of records) {
    recordMap.set(r.date, r)
  }

  // Calendar grid calculations (Monday = 0)
  const firstDay = startOfMonth(currentMonth)
  const lastDay = endOfMonth(currentMonth)
  const startPad = (getDay(firstDay) + 6) % 7
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })

  // Summary counts
  const counts = { present: 0, absent: 0, late: 0, excused: 0 }
  for (const r of records) {
    if (r.status in counts) counts[r.status as keyof typeof counts]++
  }
  const totalRecorded = counts.present + counts.absent + counts.late + counts.excused

  // Selected day detail
  const selectedRecord = selectedDay ? (recordMap.get(selectedDay) ?? null) : null

  function handleDayClick(dateStr: string) {
    if (recordMap.has(dateStr)) {
      setSelectedDay((prev) => (prev === dateStr ? null : dateStr))
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('attendance')}</h2>
      </div>

      {/* Calendar card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentMonth((m) => subMonths(m, 1))
              setSelectedDay(null)
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-bold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => {
              setCurrentMonth((m) => addMonths(m, 1))
              setSelectedDay(null)
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse mx-auto"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7">
              {DAY_HEADERS.map((d, i) => (
                <div
                  key={i}
                  className="w-9 h-7 flex items-center justify-center mx-auto text-xs font-semibold text-gray-400 dark:text-gray-600"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1">
              {/* Leading empty cells */}
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} className="w-9 h-9 mx-auto" />
              ))}

              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const record = recordMap.get(dateStr)
                const isSelected = selectedDay === dateStr
                const today = isToday(day)
                const future = isFuture(day)

                let cellClass =
                  'w-9 h-9 flex flex-col items-center justify-center rounded-lg mx-auto cursor-default select-none text-xs font-semibold transition-all'

                if (record) {
                  cellClass += ` ${STATUS_CELL[record.status]} cursor-pointer`
                } else if (future) {
                  cellClass += ' text-gray-300 dark:text-gray-700'
                } else {
                  cellClass += ' text-gray-400 dark:text-gray-600'
                }

                if (isSelected) {
                  cellClass +=
                    ' ring-2 ring-kinder-orange ring-offset-1 ring-offset-white dark:ring-offset-gray-900'
                }

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr)}
                    disabled={!record}
                    className={cellClass}
                    aria-label={`${dateStr}${record ? ` - ${record.status}` : ''}`}
                  >
                    <span className="leading-none">{format(day, 'd')}</span>
                    {today && (
                      <span className="w-1 h-1 rounded-full bg-kinder-orange mt-0.5 block" />
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Monthly summary bar */}
        {!isLoading && totalRecorded > 0 && (
          <div className="space-y-2 pt-1">
            {/* Stacked bar */}
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
              {(['present', 'late', 'excused', 'absent'] as const).map((status) => {
                const pct = (counts[status] / totalRecorded) * 100
                if (pct === 0) return null
                return (
                  <div
                    key={status}
                    className={`h-full ${STATUS_BAR[status]}`}
                    style={{ width: `${pct}%` }}
                  />
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
              {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                <span
                  key={status}
                  className={`text-xs font-medium capitalize ${STATUS_LEGEND[status]}`}
                >
                  {status}: {counts[status]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* No records state */}
        {!isLoading && totalRecorded === 0 && (
          <div className="text-center py-6 text-gray-400 dark:text-gray-600">
            <p className="text-sm font-medium">No records for this month</p>
          </div>
        )}
      </div>

      {/* Selected day detail card */}
      {selectedRecord && selectedDay && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-MY', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize ${STATUS_BADGE[selectedRecord.status]}`}
            >
              {selectedRecord.status}
            </span>
          </div>
          {selectedRecord.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-2">
              {selectedRecord.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
