import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { feesApi, studentsApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import type { FeeRecord } from '@/types'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { DiscardDialog } from '@/components/ui/DiscardDialog'

const FEE_TYPES = ['tuition', 'activity', 'uniform', 'registration', 'other'] as const

interface Props {
  record: FeeRecord | null
  onClose: () => void
}

export function FeeRecordModal({ record, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)
  const isEdit = record !== null

  const [studentId, setStudentId] = useState('')
  const [type, setType] = useState<(typeof FEE_TYPES)[number]>('tuition')
  const [description, setDescription] = useState('')
  const [amountOwed, setAmountOwed] = useState('')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [discountReason, setDiscountReason] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: studentsData } = useQuery({
    queryKey: ['students', { page: 1, limit: 500 }],
    queryFn: () => studentsApi.getAll({ limit: 500 }),
    enabled: !isEdit,
  })

  useEffect(() => {
    if (record) {
      setStudentId(record.student_id)
      setType(record.type)
      setDescription(record.description)
      setAmountOwed(String(record.amount_owed))
      setDiscountAmount(String(record.discount_amount))
      setDiscountReason(record.discount_reason ?? '')
      setDueDate(record.due_date ?? '')
      resetDirty()
    }
  }, [record])

  const mutation = useMutation({
    mutationFn: (data: object) =>
      isEdit ? feesApi.update(record!.id, data) : feesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      toast.success(isEdit ? 'Fee record updated' : 'Fee record created')
      onClose()
    },
    onError: () => toast.error('Failed to save fee record. Please try again.'),
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!isEdit && !studentId) e.studentId = t('required')
    if (!description.trim()) e.description = t('required')
    if (!amountOwed || isNaN(Number(amountOwed)) || Number(amountOwed) <= 0)
      e.amountOwed = t('required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    const payload: Record<string, unknown> = {
      type,
      description: description.trim(),
      amount_owed: Number(amountOwed),
      discount_amount: Number(discountAmount) || 0,
      discount_reason: discountReason.trim() || undefined,
      due_date: dueDate || undefined,
    }
    if (!isEdit) payload.student_id = studentId
    mutation.mutate(payload)
  }

  const students = studentsData?.data ?? []
  const showDiscount = Number(discountAmount) > 0

  const inputCls = (err?: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border ${err ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange transition-colors`
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'

  const typeLabel = (tp: string) => {
    const map: Record<string, string> = {
      tuition: t('feeTypeTuition'),
      activity: t('feeTypeActivity'),
      uniform: t('feeTypeUniform'),
      registration: t('feeTypeRegistration'),
      other: t('feeTypeOther'),
    }
    return map[tp] ?? tp
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? t('editFeeRecord') : t('addFeeRecord')}
          </h2>
          <button
            onClick={requestClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Student (add mode only) */}
          {!isEdit && (
            <div>
              <label className={labelCls}>{t('feeStudent')} *</label>
              <select
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value)
                  markDirty()
                }}
                className={inputCls(errors.studentId)}
              >
                <option value="">Select student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} — {s.class_name}
                  </option>
                ))}
              </select>
              {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
            </div>
          )}

          {/* Student info (edit mode) */}
          {isEdit && record?.students && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {record.students.full_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {record.students.class_name}
              </p>
            </div>
          )}

          {/* Type */}
          <div>
            <label className={labelCls}>{t('feeType')}</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as typeof type)
                markDirty()
              }}
              className={inputCls()}
            >
              {FEE_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {typeLabel(tp)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>{t('feeDesc')} *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                markDirty()
              }}
              placeholder="e.g. January 2026 Tuition"
              className={inputCls(errors.description)}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Amount owed */}
          <div>
            <label className={labelCls}>{t('feeOwed')} (RM) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amountOwed}
              onChange={(e) => {
                setAmountOwed(e.target.value)
                markDirty()
              }}
              placeholder="0.00"
              className={inputCls(errors.amountOwed)}
            />
            {errors.amountOwed && <p className="text-red-500 text-xs mt-1">{errors.amountOwed}</p>}
          </div>

          {/* Discount */}
          <div>
            <label className={labelCls}>{t('discountAmount')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountAmount}
              onChange={(e) => {
                setDiscountAmount(e.target.value)
                markDirty()
              }}
              placeholder="0.00"
              className={inputCls()}
            />
          </div>

          {/* Discount reason (shown when discount > 0) */}
          {showDiscount && (
            <div>
              <label className={labelCls}>{t('discountReason')}</label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => {
                  setDiscountReason(e.target.value)
                  markDirty()
                }}
                placeholder="e.g. Sibling discount"
                className={inputCls()}
              />
            </div>
          )}

          {/* Due date */}
          <div>
            <label className={labelCls}>{t('dueDate')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value)
                markDirty()
              }}
              className={inputCls()}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-kinder-orange text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-orange-600 transition-colors"
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
