import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck2, CalendarX2, Clock, MinusCircle } from 'lucide-react'
import { useParentAuth } from '../../hooks/useParentAuth'
import { portalDataApi } from '../../lib/api'
import { useT } from '../../hooks/useT'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { AttendanceRecord } from '../../types'

const STATUS_CONFIG = {
  present: {
    icon: CalendarCheck2,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  absent: { icon: CalendarX2, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  late: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  excused: { icon: MinusCircle, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
}

const LIMIT = 20

export default function PortalAttendancePage() {
  usePageTitle('Attendance')
  const { student } = useParentAuth()
  const t = useT()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['portal-attendance', student?.id, { page, limit: LIMIT }],
    queryFn: () => portalDataApi.getAttendance({ page, limit: LIMIT }),
    enabled: !!student,
    placeholderData: (prev) => prev,
  })

  const records: AttendanceRecord[] = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = data?.meta?.totalPages ?? 1

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('attendance')}</h2>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
          <CalendarCheck2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No attendance records yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const cfg = STATUS_CONFIG[r.status]
            const Icon = cfg.icon
            return (
              <div
                key={r.id}
                className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(r.date + 'T00:00:00').toLocaleDateString('en-MY', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {r.notes && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{r.notes}</p>
                  )}
                </div>
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="capitalize">{r.status}</span>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-kinder-orange transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {page} / {totalPages} ({total} records)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-kinder-orange transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
