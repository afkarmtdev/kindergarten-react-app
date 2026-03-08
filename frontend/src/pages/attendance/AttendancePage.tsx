import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { CalendarCheck, Save, Download, Printer } from 'lucide-react'
import { attendanceApi, studentsApi } from '@/lib/api'
import { useAttendanceStore } from '@/store/attendanceStore'
import { Pagination } from '@/components/ui/Pagination'
import { TableRowSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAttendanceRealtime } from '@/hooks/useAttendanceRealtime'
import { STATUS_CONFIG, type Status } from './constants'
import { AttendanceRow } from './components/AttendanceRow'
import { AttendancePrintView } from './components/AttendancePrintView'
import type { Student, AttendanceRecord } from '@/types'

const LIMIT = 20

export function AttendancePage() {
  usePageTitle('Attendance')
  const t = useT()
  const queryClient = useQueryClient()
  const [printOpen, setPrintOpen] = useState(false)
  const {
    selectedDate,
    page,
    statusFilter,
    pendingChanges,
    setDate,
    setPage,
    setStatusFilter,
    setPending,
    clearPending,
  } = useAttendanceStore()

  useAttendanceRealtime(selectedDate)

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', { page, limit: LIMIT }],
    queryFn: () => studentsApi.getAll({ page, limit: LIMIT }),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  })

  const { data: recordsData } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () => attendanceApi.getByDate(selectedDate, { limit: 999 }),
    staleTime: 30_000,
  })

  const { data: allStudentsData } = useQuery({
    queryKey: ['students-print'],
    queryFn: () => studentsApi.getAll({ limit: 100 }),
    enabled: printOpen,
    staleTime: 60_000,
  })

  const bulkMutation = useMutation({
    mutationFn: attendanceApi.bulkMark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      clearPending()
      toast.success('Attendance saved')
    },
    onError: () => {
      toast.error('Failed to save attendance. Please try again.')
    },
  })

  const students = studentsData?.data ?? []
  const meta = studentsData?.meta
  const records: AttendanceRecord[] = recordsData?.data ?? []

  const getStatus = (studentId: string): Status | null => {
    if (pendingChanges[studentId]) return pendingChanges[studentId].status
    const record = records.find((r) => r.student_id === studentId)
    return (record?.status as Status) ?? null
  }

  const handleSave = () => {
    const filtered = statusFilter
      ? Object.entries(pendingChanges).filter(([, change]) => change.status === statusFilter)
      : Object.entries(pendingChanges)
    const toSave = filtered.map(([student_id, { status, notes }]) => ({
      student_id,
      status,
      notes: notes || undefined,
      date: selectedDate,
      recorded_by: 'admin',
    }))
    if (toSave.length === 0) return
    bulkMutation.mutate(toSave)
  }

  const pendingCount = Object.keys(pendingChanges).length
  const markAllPresent = () => students.forEach((s: Student) => setPending(s.id, 'present'))
  const filteredStudents = statusFilter
    ? students.filter((s: Student) => getStatus(s.id) === statusFilter)
    : students

  const saveLabel =
    pendingCount === 1
      ? t('saveChanges', { n: pendingCount })
      : t('saveChangesPlural', { n: pendingCount })

  const handleExportCsv = async () => {
    const all = await attendanceApi.getByDate(selectedDate, { limit: 1000 })
    const rows = all.data ?? []

    const header = 'Student Name,Class,Status,Notes,Date'
    const lines = rows.map((r: AttendanceRecord) => {
      const name = (r.students?.full_name ?? '').replace(/,/g, ' ')
      const cls = (r.students?.class_name ?? '').replace(/,/g, ' ')
      const notes = (r.notes ?? '').replace(/,/g, ' ')
      return `${name},${cls},${r.status},${notes},${r.date}`
    })

    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${selectedDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {t('attendance')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 md:flex-none border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 bg-white dark:bg-gray-800 dark:text-gray-200"
          />
          <button
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 flex-1 md:flex-none border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <Download size={15} />
            {t('exportCsv')}
          </button>
          <button
            onClick={() => setPrintOpen(true)}
            className="flex items-center justify-center gap-2 flex-1 md:flex-none border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <Printer size={15} />
            {t('printAttendance')}
          </button>
          <button
            onClick={markAllPresent}
            className="flex-1 md:flex-none border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
          >
            {t('markAllPresent')}
          </button>
          {pendingCount > 0 && (
            <button
              onClick={handleSave}
              disabled={bulkMutation.isPending}
              className="flex items-center justify-center gap-2 flex-1 md:flex-none bg-kinder-green text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-600 transition-all disabled:opacity-60 shadow-sm"
            >
              <Save size={16} />
              {bulkMutation.isPending ? t('saving') : saveLabel}
            </button>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['', 'present', 'absent', 'late', 'excused'] as const).map((s) => {
          const isAll = s === ''
          const cfg = !isAll ? STATUS_CONFIG[s] : null
          const isActive = statusFilter === s
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                isActive
                  ? isAll
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                    : cfg!.bg + ' border-current'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {!isAll && cfg && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
              {isAll ? t('all') : t(cfg!.labelKey)}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
              <th className="text-left px-3 md:px-6 py-2 md:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('student')}
              </th>
              <th className="text-left px-3 md:px-6 py-2 md:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('class')}
              </th>
              <th className="text-left px-3 md:px-6 py-2 md:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('markAttendance')}
              </th>
            </tr>
          </thead>
          <tbody>
            {studentsLoading
              ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={3} />)
              : filteredStudents.map((student: Student, i: number) => (
                  <AttendanceRow
                    key={student.id}
                    student={student}
                    status={getStatus(student.id)}
                    notes={pendingChanges[student.id]?.notes}
                    isPending={!!pendingChanges[student.id]}
                    index={i}
                    onMark={setPending}
                  />
                ))}
          </tbody>
        </table>

        {!studentsLoading && filteredStudents.length === 0 && (
          <EmptyState
            icon={CalendarCheck}
            title={t('noStudentsToShow')}
            subtitle={
              statusFilter
                ? t('noStudentsMarked', { status: t(statusFilter as Status) })
                : t('noStudentsEnrolled')
            }
          />
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

      {printOpen && (
        <AttendancePrintView
          students={allStudentsData?.data ?? []}
          records={records}
          selectedDate={selectedDate}
          classFilter=""
          onClose={() => setPrintOpen(false)}
        />
      )}
    </div>
  )
}
