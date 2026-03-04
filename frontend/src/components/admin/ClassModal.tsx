import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, School } from 'lucide-react'
import { classesApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { DiscardDialog } from '@/components/ui/DiscardDialog'
import type { ClassRoom } from '@/types'

interface ClassModalProps {
  open: boolean
  onClose: () => void
  classroom?: ClassRoom | null
}

const empty = {
  name: '',
  teacher_name: '',
  capacity: '25',
}

export function ClassModal({ open, onClose, classroom }: ClassModalProps) {
  const t = useT()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState<Partial<typeof empty>>({})
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  useEffect(() => {
    if (classroom) {
      setForm({
        name: classroom.name,
        teacher_name: classroom.teacher_name,
        capacity: String(classroom.capacity),
      })
    } else {
      setForm({ ...empty })
    }
    setErrors({})
    resetDirty()
  }, [classroom, open])

  const mutation = useMutation({
    mutationFn: (data: { name: string; teacher_name: string; capacity: number }) =>
      classroom ? classesApi.update(classroom.id, data) : classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      toast.success(classroom ? 'Class updated' : 'Class created')
      onClose()
    },
    onError: () => {
      toast.error('Failed to save class. Please try again.')
    },
  })

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    markDirty()
  }

  const validate = () => {
    const e: Partial<typeof empty> = {}
    if (!form.name.trim()) e.name = t('required')
    if (!form.teacher_name.trim()) e.teacher_name = t('required')
    const cap = parseInt(form.capacity)
    if (!form.capacity || isNaN(cap) || cap < 1) e.capacity = t('required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate({
      name: form.name.trim(),
      teacher_name: form.teacher_name.trim(),
      capacity: parseInt(form.capacity),
    })
  }

  if (!open) return null

  const inputCls = (field: keyof typeof empty) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 dark:text-gray-100 ${
      errors[field]
        ? 'border-red-400 focus:ring-red-300'
        : 'border-gray-200 dark:border-gray-600 focus:ring-kinder-orange/50 focus:border-kinder-orange'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={requestClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kinder-purple rounded-2xl flex items-center justify-center">
              <School size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {classroom ? t('editClass') : t('addClass')}
            </h2>
          </div>
          <button
            onClick={requestClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Class Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('className')} *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputCls('name')}
              placeholder="Sunflower"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Teacher Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('teacherName')} *
            </label>
            <input
              type="text"
              value={form.teacher_name}
              onChange={(e) => set('teacher_name', e.target.value)}
              className={inputCls('teacher_name')}
              placeholder="Cik Aishah binti Razak"
            />
            {errors.teacher_name && (
              <p className="text-xs text-red-500 mt-1">{errors.teacher_name}</p>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('capacityLabel')} *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.capacity}
              onChange={(e) => set('capacity', e.target.value)}
              className={inputCls('capacity')}
            />
            {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
          </div>

          {mutation.isError && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              Something went wrong. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-kinder-orange text-white font-semibold text-sm hover:bg-orange-600 transition-all disabled:opacity-60 shadow-sm"
            >
              {mutation.isPending ? t('saving2') : t('save')}
            </button>
          </div>
        </form>
      </div>
      <DiscardDialog show={showConfirm} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  )
}
