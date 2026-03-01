import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Check,
  X,
  Clock,
  FileX,
  Pencil,
  CalendarCheck,
  Gift,
} from 'lucide-react'
import { studentsApi, attendanceApi } from '@/lib/api'
import { isBirthdayToday } from '@/lib/utils'
import { Pagination } from '@/components/ui/Pagination'
import { TableRowSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { StudentModal } from '@/components/admin/StudentModal'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { Student, AttendanceRecord } from '@/types'

const LIMIT = 15

const STATUS_CONFIG = {
  present: {
    icon: Check,
    bg: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    dot: 'bg-green-500',
  },
  absent: {
    icon: X,
    bg: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    dot: 'bg-red-500',
  },
  late: {
    icon: Clock,
    bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  excused: {
    icon: FileX,
    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
} as const

type Status = keyof typeof STATUS_CONFIG

export function StudentProfilePage() {
  const t = useT()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.getById(id!),
    enabled: !!id,
  })

  usePageTitle(student?.full_name)

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance-history', id, page],
    queryFn: () => attendanceApi.getByStudent(id!, { page, limit: LIMIT }),
    enabled: !!id,
    placeholderData: (prev) => prev,
  })

  const records: AttendanceRecord[] = historyData?.data ?? []
  const meta = historyData?.meta
  const s: Student | undefined = student

  const stats = records.reduce(
    (acc, r) => {
      acc[r.status as Status] = (acc[r.status as Status] ?? 0) + 1
      return acc
    },
    {} as Record<Status, number>
  )
  const totalInPage = records.length
  const totalAll = meta?.total ?? 0
  const presentRate =
    totalAll > 0
      ? Math.round(
          ((historyData?.data ?? []).filter((r: AttendanceRecord) => r.status === 'present')
            .length /
            totalInPage) *
            100
        )
      : 0

  const closeModal = () => {
    setEditModalOpen(false)
    queryClient.invalidateQueries({ queryKey: ['student', id] })
  }

  return (
    <div className="p-4 md:p-8">
      {/* Back + Edit header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/admin/students"
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-kinder-orange dark:hover:text-kinder-orange transition-colors font-semibold"
        >
          <ArrowLeft size={16} />
          {t('backToStudents')}
        </Link>
        {s && (
          <button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-semibold hover:border-kinder-blue hover:text-kinder-blue dark:hover:text-kinder-blue transition-all"
          >
            <Pencil size={14} />
            {t('editStudent')}
          </button>
        )}
      </div>

      {studentLoading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
          </div>
        </div>
      ) : s ? (
        <>
          {/* Student info card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar */}
              {s.photo_url ? (
                <img
                  src={s.photo_url}
                  alt={s.full_name}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 bg-kinder-blue rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-2xl">{s.full_name[0]}</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                  {s.full_name}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-block bg-orange-50 dark:bg-orange-900/30 text-kinder-orange text-xs font-semibold px-2.5 py-1 rounded-full">
                    {s.class_name}
                  </span>
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                      s.gender === 'male'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                    }`}
                  >
                    {s.gender === 'male' ? t('boy') : t('girl')}
                  </span>
                  {s.date_of_birth && (
                    <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {format(new Date(s.date_of_birth + 'T00:00:00'), 'dd MMM yyyy')}
                    </span>
                  )}
                  {s.date_of_birth && isBirthdayToday(s.date_of_birth) && (
                    <span className="inline-flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Gift size={11} />
                      {t('birthdayToday')}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <User size={13} className="flex-shrink-0" />
                    <span>{s.parent_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Mail size={13} className="flex-shrink-0" />
                    <span>{s.parent_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Phone size={13} className="flex-shrink-0" />
                    <span>{s.parent_phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              {[
                {
                  label: t('totalRecorded'),
                  value: totalAll,
                  color: 'text-gray-700 dark:text-gray-200',
                },
                { label: t('presentRate'), value: `${presentRate}%`, color: 'text-kinder-green' },
                { label: t('absent'), value: stats.absent ?? 0, color: 'text-red-500' },
                { label: t('late'), value: stats.late ?? 0, color: 'text-yellow-500' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center"
                >
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance history */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">
                {t('attendanceHistory')}
              </h2>
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
                {historyLoading
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

            {!historyLoading && records.length === 0 && (
              <EmptyState icon={CalendarCheck} title={t('noAttendanceRecords')} subtitle="" />
            )}
          </div>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={LIMIT}
              onPageChange={setPage}
            />
          )}
        </>
      ) : null}

      {s && <StudentModal open={editModalOpen} onClose={closeModal} student={s} />}
    </div>
  )
}
