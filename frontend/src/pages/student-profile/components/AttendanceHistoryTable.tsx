import { format } from 'date-fns'
import { Check, CalendarCheck } from 'lucide-react'
import { TableRowSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { Pagination } from '@/components/ui/Pagination'
import { useT } from '@/hooks/useT'
import { STATUS_CONFIG, type Status } from '../constants'
import type { AttendanceRecord } from '@/types'

const LIMIT = 15

export function AttendanceHistoryTable({
  records,
  isLoading,
  meta,
  page,
  onPageChange,
}: {
  records: AttendanceRecord[]
  isLoading: boolean
  meta: { total: number; totalPages: number } | undefined
  page: number
  onPageChange: (p: number) => void
}) {
  const t = useT()

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('attendanceHistory')}</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-3 md:px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('dateOfBirth').replace('Date of Birth', 'Date')}
              </th>
              <th className="text-left px-3 md:px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('markAttendance').replace('Mark Attendance', 'Status')}
              </th>
              <th className="text-left px-3 md:px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={3} />)
              : records.map((record: AttendanceRecord, i: number) => {
                  const cfg = STATUS_CONFIG[record.status as Status]
                  const Icon = cfg?.icon ?? Check
                  return (
                    <tr
                      key={record.id}
                      className={`border-b border-gray-50 dark:border-gray-800 last:border-0 ${
                        i % 2 === 0
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-gray-50/30 dark:bg-gray-800/30'
                      }`}
                    >
                      <td className="px-3 md:px-6 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {format(new Date(record.date + 'T00:00:00'), 'dd MMM yyyy')}
                      </td>
                      <td className="px-3 md:px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg?.bg ?? ''}`}
                        >
                          <Icon size={11} />
                          {t(record.status as Status)}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 text-sm text-gray-400 dark:text-gray-500 hidden sm:table-cell">
                        {record.notes ?? '—'}
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>

        {!isLoading && records.length === 0 && (
          <EmptyState icon={CalendarCheck} title={t('noAttendanceRecords')} subtitle="" />
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={LIMIT}
          onPageChange={onPageChange}
        />
      )}
    </>
  )
}
