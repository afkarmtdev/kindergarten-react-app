import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { GraduationCap, X, Check } from 'lucide-react'
import { studentsApi, classesApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import type { ClassRoom, Student } from '@/types'

interface GraduateClassModalProps {
  open: boolean
  classroom: ClassRoom | null
  onClose: () => void
}

export function GraduateClassModal({ open, classroom, onClose }: GraduateClassModalProps) {
  const t = useT()
  const queryClient = useQueryClient()
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)
  const [reassignClassId, setReassignClassId] = useState('')

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', { class_id: classroom?.id, status: 'active', limit: 100 }],
    queryFn: () => studentsApi.getAll({ class_id: classroom!.id, status: 'active', limit: 100 }),
    enabled: open && !!classroom,
    staleTime: 30_000,
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes', { page: 1, search: '', status: 'active' }],
    queryFn: () => classesApi.getAll({ limit: 100, status: 'active' }),
    enabled: open && !!classroom,
    staleTime: 60_000,
  })

  const students: Student[] = studentsData?.data ?? []
  const otherClasses = (classesData?.data ?? []).filter((c) => c.id !== classroom?.id)

  // Initialize all students as checked when data loads
  if (students.length > 0 && !initialized) {
    setCheckedIds(new Set(students.map((s) => s.id)))
    setInitialized(true)
  }

  // Reset state when modal closes/opens
  if (!open && initialized) {
    setInitialized(false)
    setCheckedIds(new Set())
    setReassignClassId('')
  }

  const toggleStudent = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (checkedIds.size === students.length) {
      setCheckedIds(new Set())
    } else {
      setCheckedIds(new Set(students.map((s) => s.id)))
    }
  }

  const graduateIds = useMemo(
    () => students.filter((s) => checkedIds.has(s.id)).map((s) => s.id),
    [students, checkedIds]
  )
  const uncheckedIds = useMemo(
    () => students.filter((s) => !checkedIds.has(s.id)).map((s) => s.id),
    [students, checkedIds]
  )
  const destinationClass = otherClasses.find((c) => c.id === reassignClassId)

  const mutation = useMutation({
    mutationFn: () =>
      classesApi.graduate(classroom!.id, {
        student_ids: graduateIds,
        reassign_class_id: reassignClassId || undefined,
        reassign_student_ids: uncheckedIds.length > 0 && reassignClassId ? uncheckedIds : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success(t('classGraduated'))
      onClose()
    },
    onError: () => {
      toast.error('Failed to graduate class. Please try again.')
    },
  })

  if (!open || !classroom) return null

  const allChecked = checkedIds.size === students.length
  const hasUnchecked = uncheckedIds.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kinder-purple rounded-2xl flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('graduateClass')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {classroom.name} ({classroom.academic_year})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {studentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-shimmer bg-[length:200%_100%]"
                />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <GraduationCap size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">{t('noActiveStudents')}</p>
            </div>
          ) : (
            <>
              {/* Select all toggle */}
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-kinder-orange dark:hover:text-kinder-orange transition-colors mb-3"
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    allChecked
                      ? 'bg-kinder-orange border-kinder-orange'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {allChecked && <Check size={10} className="text-white" />}
                </div>
                {allChecked ? t('deselectAll') : t('selectAll')}
              </button>

              {/* Student list */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {students.map((student) => {
                  const isChecked = checkedIds.has(student.id)
                  return (
                    <button
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-kinder-orange border-kinder-orange'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isChecked && <Check size={12} className="text-white" />}
                      </div>
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={student.full_name}
                          className="w-8 h-8 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-kinder-blue rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-xs">
                            {student.full_name[0]}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {student.full_name}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Reassign section */}
              {hasUnchecked && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('reassignTo')} ({uncheckedIds.length})
                  </label>
                  <select
                    value={reassignClassId}
                    onChange={(e) => setReassignClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange transition-all"
                  >
                    <option value="">-- {t('selectClass')} --</option>
                    {otherClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.academic_year})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {students.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
            {/* Summary */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-0.5">
              <p>{t('studentsToGraduate', { n: graduateIds.length })}</p>
              {hasUnchecked && destinationClass && (
                <p>
                  {t('studentsToReassign', {
                    n: uncheckedIds.length,
                    cls: `${destinationClass.name} (${destinationClass.academic_year})`,
                  })}
                </p>
              )}
              {hasUnchecked && !reassignClassId && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  {uncheckedIds.length} students will remain in this class without reassignment
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || graduateIds.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-kinder-purple text-white font-semibold text-sm hover:bg-purple-600 transition-all disabled:opacity-60 shadow-sm flex items-center justify-center gap-2"
              >
                <GraduationCap size={15} />
                {mutation.isPending ? t('saving2') : t('graduateClass')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
