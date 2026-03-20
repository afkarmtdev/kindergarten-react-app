import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Briefcase } from 'lucide-react'
import { careersApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { DiscardDialog } from '@/components/ui/DiscardDialog'
import type { JobPosting } from '@/types'

interface Props {
  show: boolean
  posting: JobPosting | null
  onClose: () => void
}

const empty = {
  title: '',
  type: 'full_time' as JobPosting['type'],
  department: '',
  description: '',
  requirements: '',
  salary_min: '' as string,
  salary_max: '' as string,
  is_salary_range: false,
  status: 'draft' as JobPosting['status'],
  display_order: 0,
}

export function JobPostingModal({ show, posting, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState<Partial<Record<'title' | 'description', string>>>({})
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  useEffect(() => {
    if (posting) {
      const hasRange =
        posting.salary_max != null &&
        posting.salary_min != null &&
        posting.salary_max !== posting.salary_min
      setForm({
        title: posting.title,
        type: posting.type,
        department: posting.department ?? '',
        description: posting.description,
        requirements: posting.requirements ?? '',
        salary_min: posting.salary_min != null ? String(posting.salary_min) : '',
        salary_max: posting.salary_max != null ? String(posting.salary_max) : '',
        is_salary_range: hasRange,
        status: posting.status,
        display_order: posting.display_order,
      })
    } else {
      setForm({ ...empty })
    }
    setErrors({})
    resetDirty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posting, show])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    markDirty()
  }

  const validate = () => {
    const e: Partial<Record<'title' | 'description', string>> = {}
    if (!form.title.trim()) e.title = t('required')
    if (!form.description.trim()) e.description = t('required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const salaryMin = data.salary_min ? parseFloat(data.salary_min) : null
      const salaryMax =
        data.is_salary_range && data.salary_max ? parseFloat(data.salary_max) : salaryMin
      const { is_salary_range: _isRange, salary_min: _sMin, salary_max: _sMax, ...rest } = data
      const payload = {
        ...rest,
        department: data.department || undefined,
        requirements: data.requirements || undefined,
        salary_min: salaryMin,
        salary_max: salaryMax,
      }
      return posting
        ? careersApi.updatePosting(posting.id, payload)
        : careersApi.createPosting(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] })
      toast.success(posting ? t('postingUpdated') : t('postingCreated'))
      onClose()
    },
    onError: () => {
      toast.error('Failed to save job posting. Please try again.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate(form)
  }

  const inputCls = (field: 'title' | 'description') =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 dark:text-gray-100 ${
      errors[field]
        ? 'border-red-400 focus:ring-red-300'
        : 'border-gray-200 dark:border-gray-600 focus:ring-kinder-orange/50 focus:border-kinder-orange'
    }`

  const selectCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange transition-all'

  const baseCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-kinder-orange/50 focus:border-kinder-orange transition-all'

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={requestClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-kinder-blue rounded-2xl flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">
              {posting ? t('editPosting') : t('addPosting')}
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('postingTitle')} *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Kindergarten Teacher..."
              className={inputCls('title')}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Type + Status in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('jobType')}
              </label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as JobPosting['type'])}
                className={selectCls}
              >
                <option value="full_time">{t('fullTime')}</option>
                <option value="part_time">{t('partTime')}</option>
                <option value="internship">{t('internship')}</option>
                <option value="contract">{t('contract')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                {t('status')}
              </label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as JobPosting['status'])}
                className={selectCls}
              >
                <option value="draft">{t('draft')}</option>
                <option value="published">{t('published')}</option>
                <option value="closed">{t('closed')}</option>
              </select>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('department')}
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              placeholder="Teaching, Administration..."
              className={baseCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('jobDescription')} *
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the role and responsibilities..."
              className={`${inputCls('description')} resize-none`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('requirements')}
            </label>
            <textarea
              rows={3}
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
              placeholder="Diploma in Early Childhood Education..."
              className={`${baseCls} resize-none`}
            />
          </div>

          {/* Salary */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                {t('salaryRange')}
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <div
                  onClick={() => set('is_salary_range', !form.is_salary_range)}
                  className={`relative w-7 h-3.5 rounded-full transition-colors duration-200 ${form.is_salary_range ? 'bg-kinder-orange' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <div
                    className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_salary_range ? 'translate-x-3.5' : 'translate-x-0.5'}`}
                  />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('salaryRange')}
                </span>
              </label>
            </div>
            <div className={`grid gap-3 ${form.is_salary_range ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                  RM
                </span>
                <input
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => set('salary_min', e.target.value)}
                  placeholder={form.is_salary_range ? 'Min' : 'Amount'}
                  min={0}
                  step="0.01"
                  className={`${baseCls} pl-11`}
                />
              </div>
              {form.is_salary_range && (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    RM
                  </span>
                  <input
                    type="number"
                    value={form.salary_max}
                    onChange={(e) => set('salary_max', e.target.value)}
                    placeholder="Max"
                    min={0}
                    step="0.01"
                    className={`${baseCls} pl-11`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              {t('displayOrder')}
            </label>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => set('display_order', parseInt(e.target.value, 10) || 0)}
              min={0}
              className={baseCls}
            />
          </div>

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
