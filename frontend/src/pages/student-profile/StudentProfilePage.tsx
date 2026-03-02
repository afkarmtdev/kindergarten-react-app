import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil } from 'lucide-react'
import { studentsApi, attendanceApi } from '@/lib/api'
import { StudentModal } from '@/components/admin/StudentModal'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { type Status } from './constants'
import { StudentInfoCard } from './components/StudentInfoCard'
import { AttendanceHeatmap } from './components/AttendanceHeatmap'
import { AttendanceHistoryTable } from './components/AttendanceHistoryTable'
import type { Student, AttendanceRecord } from '@/types'

const LIMIT = 15

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
          <StudentInfoCard
            student={s}
            stats={stats}
            presentRate={presentRate}
            totalAll={totalAll}
            onEdit={() => setEditModalOpen(true)}
          />

          <AttendanceHeatmap studentId={s.id} />

          <AttendanceHistoryTable
            records={records}
            isLoading={historyLoading}
            meta={meta}
            page={page}
            onPageChange={setPage}
          />
        </>
      ) : null}

      {s && <StudentModal open={editModalOpen} onClose={closeModal} student={s} />}
    </div>
  )
}
