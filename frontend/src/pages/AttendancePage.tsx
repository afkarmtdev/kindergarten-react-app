import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarCheck, Check, X, Clock, FileX, Save, Download } from 'lucide-react'
import { attendanceApi, studentsApi } from '@/lib/api'
import { useAttendanceStore } from '@/store/attendanceStore'
import { Pagination } from '@/components/ui/Pagination'
import { TableRowSkeleton, EmptyState } from '@/components/ui/Skeletons'
import { useT } from '@/hooks/useT'
import type { Student, AttendanceRecord } from '@/types'

const LIMIT = 20

const STATUS_CONFIG = {
  present: { labelKey: 'present' as const, icon: Check, bg: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800', dot: 'bg-green-500' },
  absent:  { labelKey: 'absent'  as const, icon: X,     bg: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800',       dot: 'bg-red-500' },
  late:    { labelKey: 'late'    as const, icon: Clock,  bg: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800', dot: 'bg-yellow-500' },
  excused: { labelKey: 'excused' as const, icon: FileX,  bg: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800', dot: 'bg-blue-500' },
} as const

type Status = keyof typeof STATUS_CONFIG

export function AttendancePage() {
  const t = useT()
  const queryClient = useQueryClient()
  const { selectedDate, page, statusFilter, pendingChanges, setDate, setPage, setStatusFilter, setPending, clearPending } =
    useAttendanceStore()

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

  const bulkMutation = useMutation({
    mutationFn: attendanceApi.bulkMark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      clearPending()
    },
  })

  const students = studentsData?.data ?? []
  const meta = studentsData?.meta
  const records: AttendanceRecord[] = recordsData?.data ?? []

  const getStatus = (studentId: string): Status | null => {
    if (pendingChanges[studentId]) return pendingChanges[studentId] as Status
    const record = records.find((r) => r.student_id === studentId)
    return (record?.status as Status) ?? null
  }

  const handleSave = () => {
    const filtered = statusFilter
      ? Object.entries(pendingChanges).filter(([, s]) => s === statusFilter)
      : Object.entries(pendingChanges)
    const toSave = filtered.map(([student_id, status]) => ({
      student_id, status, date: selectedDate, recorded_by: 'admin',
    }))
    if (toSave.length === 0) return
    bulkMutation.mutate(toSave)
  }

  const pendingCount = Object.keys(pendingChanges).length
  const markAllPresent = () => students.forEach((s: Student) => setPending(s.id, 'present'))
  const filteredStudents = statusFilter
    ? students.filter((s: Student) => getStatus(s.id) === statusFilter)
    : students

  const saveLabel = pendingCount === 1
    ? t('saveChanges', { n: pendingCount })
    : t('saveChangesPlural', { n: pendingCount })

  const handleExportCsv = async () => {
    const all = await attendanceApi.getByDate(selectedDate, { limit: 1000 })
    const rows = all.data ?? []

    const header = 'Student Name,Class,Status,Notes,Date'
    const lines = rows.map((r) => {
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{t('attendance')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 bg-white dark:bg-gray-800 dark:text-gray-200"
          />
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <Download size={15} />
            {t('exportCsv')}
          </button>
          <button
            onClick={markAllPresent}
            className="border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
          >
            {t('markAllPresent')}
          </button>
          {pendingCount > 0 && (
            <button
              onClick={handleSave}
              disabled={bulkMutation.isPending}
              className="flex items-center gap-2 bg-kinder-green text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-600 transition-all disabled:opacity-60 shadow-sm"
            >
              <Save size={16} />
              {bulkMutation.isPending ? t('saving') : saveLabel}
            </button>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('student')}</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('class')}</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('markAttendance')}</th>
            </tr>
          </thead>
          <tbody>
            {studentsLoading
              ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={3} />)
              : filteredStudents.map((student: Student, i: number) => {
                  const status = getStatus(student.id)
                  const isPending = !!pendingChanges[student.id]
                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors ${
                        isPending
                          ? 'bg-amber-50/40 dark:bg-amber-900/10'
                          : i % 2 === 0
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-gray-50/30 dark:bg-gray-800/30'
                      }`}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-kinder-blue rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {student.full_name[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{student.full_name}</span>
                            {isPending && (
                              <span className="ml-2 text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                                {t('unsaved')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{student.class_name}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex gap-1.5 flex-wrap">
                          {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
                            const { labelKey, icon: Icon, bg } = STATUS_CONFIG[s]
                            const isActive = status === s
                            return (
                              <button
                                key={s}
                                onClick={() => setPending(student.id, s)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  isActive
                                    ? bg
                                    : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                              >
                                <Icon size={11} />
                                {t(labelKey)}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>

        {!studentsLoading && filteredStudents.length === 0 && (
          <EmptyState
            icon={CalendarCheck}
            title={t('noStudentsToShow')}
            subtitle={statusFilter
              ? t('noStudentsMarked', { status: t(statusFilter as Status) })
              : t('noStudentsEnrolled')}
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
    </div>
  )
}
