import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Save } from 'lucide-react'
import { toast } from 'sonner'
import { dailyReportsApi, classesApi } from '@/lib/api'
import { useDailyReportsStore } from '@/store/dailyReportsStore'
import { MoodPicker } from '@/components/admin/MoodPicker'
import { useT } from '@/hooks/useT'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { DailyReport, ClassRoom } from '@/types'

interface StudentWithReport {
  student: {
    id: string
    full_name: string
    class_name: string
    photo_url?: string
  }
  report: DailyReport | null
}

const MEALS_OPTIONS = ['all', 'most', 'some', 'none'] as const

export function DailyReportsPage() {
  usePageTitle('Daily Reports')
  const t = useT()
  const queryClient = useQueryClient()
  const {
    selectedDate,
    classFilter,
    page,
    pendingChanges,
    setSelectedDate,
    setClassFilter,
    setPage,
    setPendingChange,
    clearPendingChanges,
  } = useDailyReportsStore()

  const { data: classesData } = useQuery({
    queryKey: ['classes', { page: 1, limit: 100, status: 'active' }],
    queryFn: () => classesApi.getAll({ page: 1, limit: 100, status: 'active' }),
  })
  const classes: ClassRoom[] = classesData?.data ?? []

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['daily-reports', selectedDate, classFilter, page],
    queryFn: () =>
      dailyReportsApi.getByDate({
        date: selectedDate,
        class_id: classFilter || undefined,
        page,
        limit: 30,
      }),
    placeholderData: (prev) => prev,
  })

  const rows: StudentWithReport[] = data?.data ?? []
  const meta = data?.meta

  // Reset pending changes when date or class filter changes
  useEffect(() => {
    clearPendingChanges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, classFilter])

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const entries = Array.from(pendingChanges.entries())
      await Promise.all(
        entries.map(([studentId, change]) =>
          dailyReportsApi.upsert(studentId, selectedDate, change as Record<string, unknown>)
        )
      )
    },
    onSuccess: () => {
      clearPendingChanges()
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] })
      toast.success(t('reportSaved'))
    },
    onError: () => toast.error('Failed to save reports'),
  })

  function getDisplayValue<T>(studentId: string, field: keyof DailyReport, fallback: T): T {
    const pending = pendingChanges.get(studentId)
    if (pending && field in pending) return pending[field as keyof typeof pending] as T
    const row = rows.find((r) => r.student.id === studentId)
    return (row?.report?.[field] as T) ?? fallback
  }

  const hasPendingChanges = pendingChanges.size > 0

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-kinder-orange" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t('dailyReports')}
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => saveAllMutation.mutate()}
            disabled={!hasPendingChanges || saveAllMutation.isPending}
            className="flex items-center gap-2 bg-kinder-orange text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saveAllMutation.isPending ? 'Saving...' : t('saveReports')}
            {hasPendingChanges && !saveAllMutation.isPending && (
              <span className="bg-white/30 rounded-full text-xs px-1.5">{pendingChanges.size}</span>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-opacity ${isFetching ? 'opacity-70' : ''}`}
      >
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                <div className="w-28 h-7 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="w-20 h-7 bg-gray-200 dark:bg-gray-700 rounded-xl hidden md:block" />
                <div className="w-20 h-7 bg-gray-200 dark:bg-gray-700 rounded-xl hidden md:block" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
            <ClipboardList className="w-12 h-12 mb-3 opacity-40" />
            <p>No students found{classFilter ? ` in ${classFilter}` : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">
                    Student
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">
                    {t('mood')}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">
                    {t('mealsEaten')}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                    {t('napMinutes')}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                    {t('toiletCount')}
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">
                    {t('activityNote')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map(({ student }) => {
                  const isDirty = pendingChanges.has(student.id)
                  const mood = getDisplayValue(student.id, 'mood', null) as DailyReport['mood']
                  const meals = getDisplayValue(
                    student.id,
                    'meals_eaten',
                    null
                  ) as DailyReport['meals_eaten']
                  const nap = getDisplayValue(student.id, 'nap_minutes', null) as number | null
                  const toilet = getDisplayValue(student.id, 'toilet_count', null) as number | null
                  const note = getDisplayValue(student.id, 'activity_note', '') as string

                  return (
                    <tr
                      key={student.id}
                      className={`${isDirty ? 'bg-orange-50 dark:bg-orange-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} transition-colors`}
                    >
                      {/* Student name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.full_name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-kinder-orange flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {student.full_name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {student.full_name}
                          </span>
                        </div>
                      </td>

                      {/* Mood */}
                      <td className="px-4 py-3">
                        <MoodPicker
                          value={mood}
                          onChange={(m) => setPendingChange(student.id, { mood: m })}
                        />
                      </td>

                      {/* Meals */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <select
                          value={meals ?? ''}
                          onChange={(e) =>
                            setPendingChange(student.id, {
                              meals_eaten: (e.target.value || null) as DailyReport['meals_eaten'],
                            })
                          }
                          className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-kinder-orange"
                        >
                          <option value="">—</option>
                          {MEALS_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                              {t(`meals${m.charAt(0).toUpperCase() + m.slice(1)}` as 'mealsAll')}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Nap */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <input
                          type="number"
                          min={0}
                          max={480}
                          value={nap ?? ''}
                          onChange={(e) =>
                            setPendingChange(student.id, {
                              nap_minutes: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          placeholder="—"
                          className="w-16 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-kinder-orange"
                        />
                      </td>

                      {/* Toilet */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={toilet ?? ''}
                          onChange={(e) =>
                            setPendingChange(student.id, {
                              toilet_count: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          placeholder="—"
                          className="w-14 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-kinder-orange"
                        />
                      </td>

                      {/* Activity note */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={note}
                          onChange={(e) =>
                            setPendingChange(student.id, { activity_note: e.target.value || null })
                          }
                          placeholder={t('activityNote')}
                          className="w-full min-w-[120px] text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-kinder-orange"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-kinder-orange transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
            disabled={page === meta.totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-kinder-orange transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
