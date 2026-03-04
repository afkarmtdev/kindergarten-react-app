import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { feePlansApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import type { FeePlan } from '@/types'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { DiscardDialog } from '@/components/ui/DiscardDialog'

const FEE_TYPES = ['tuition', 'activity', 'uniform', 'registration', 'other'] as const

interface Props {
  plan: FeePlan | null
  onClose: () => void
}

export function FeePlanModal({ plan, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)
  const isEdit = plan !== null

  const [name, setName] = useState('')
  const [type, setType] = useState<FeePlan['type']>('tuition')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (plan) {
      setName(plan.name)
      setType(plan.type)
      setAmount(plan.amount.toString())
      setDescription(plan.description ?? '')
      resetDirty()
    }
  }, [plan])

  const mutation = useMutation({
    mutationFn: (data: object) =>
      isEdit ? feePlansApi.update(plan!.id, data) : feePlansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] })
      toast.success(isEdit ? 'Fee plan updated' : 'Fee plan created')
      onClose()
    },
    onError: () => toast.error('Failed to save fee plan. Please try again.'),
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('required')
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = t('required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    mutation.mutate({
      name: name.trim(),
      type,
      amount: Number(amount),
      description: description.trim() || undefined,
    })
  }

  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5'
  const inputCls = (err?: string) =>
    `w-full px-3.5 py-2.5 rounded-xl border ${err ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange transition-colors`

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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? t('editFeePlan') : t('addFeePlan')}
          </h2>
          <button
            onClick={requestClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className={labelCls}>{t('feePlanName')} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                markDirty()
              }}
              placeholder="e.g. Monthly Tuition Jan 2026"
              className={inputCls(errors.name)}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Type */}
          <div>
            <label className={labelCls}>{t('feeType')}</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as FeePlan['type'])
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

          {/* Amount */}
          <div>
            <label className={labelCls}>{t('feeAmount')} *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                markDirty()
              }}
              placeholder="0.00"
              className={inputCls(errors.amount)}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>{t('feeDescription')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                markDirty()
              }}
              placeholder="Optional notes"
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
