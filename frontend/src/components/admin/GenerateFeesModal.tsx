import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { feesApi, feePlansApi, classesApi } from '@/lib/api'
import { useT } from '@/hooks/useT'
import type { FeePlan } from '@/types'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { DiscardDialog } from '@/components/ui/DiscardDialog'

const FEE_TYPES = ['tuition', 'activity', 'uniform', 'registration', 'other'] as const

interface Props {
  prefillPlan?: FeePlan | null
  onClose: () => void
}

export function GenerateFeesModal({ prefillPlan, onClose }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const { markDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [useExistingPlan, setUseExistingPlan] = useState(!!prefillPlan)
  const [selectedPlanId, setSelectedPlanId] = useState(prefillPlan?.id ?? '')
  const [customType, setCustomType] = useState<(typeof FEE_TYPES)[number]>('tuition')
  const [customAmount, setCustomAmount] = useState(prefillPlan ? String(prefillPlan.amount) : '')
  const [customDescription, setCustomDescription] = useState('')
  const [targetClass, setTargetClass] = useState('all')
  const [dueDate, setDueDate] = useState('')
  const [previewCount, setPreviewCount] = useState<number | null>(null)

  const { data: plansData } = useQuery({
    queryKey: ['fee-plans', { page: 1, search: '' }],
    queryFn: () => feePlansApi.getAll({ limit: 100 }),
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes', { page: 1, search: '' }],
    queryFn: () => classesApi.getAll({ limit: 100 }),
  })

  // Fetch student count for preview when moving to step 3
  const { data: studentsData } = useQuery({
    queryKey: ['students-count-for-generate', targetClass],
    queryFn: async () => {
      const { default: axios } = await import('axios')
      const token = localStorage.getItem('access_token')
      const params = targetClass !== 'all' ? { class_name: targetClass, limit: 1 } : { limit: 1 }
      const r = await axios.get('/api/students', {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      return r.data?.meta?.total ?? 0
    },
    enabled: step === 3,
  })

  useEffect(() => {
    if (step === 3 && studentsData !== undefined) {
      setPreviewCount(studentsData)
    }
  }, [step, studentsData])

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        due_date: dueDate || undefined,
        target_class: targetClass === 'all' ? undefined : targetClass,
      }
      if (useExistingPlan && selectedPlanId) {
        payload.fee_plan_id = selectedPlanId
      } else {
        payload.type = customType
        payload.amount = Number(customAmount)
        payload.description = customDescription || undefined
      }
      return feesApi.generate(payload)
    },
    onSuccess: (data: { created: number }) => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      toast.success(`Generated ${data.created} fee records`)
      onClose()
    },
    onError: () => toast.error('Failed to generate fees. Please try again.'),
  })

  const plans = plansData?.data ?? []
  const classes = classesData?.data ?? []

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange transition-colors'
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

  const canGoStep2 = useExistingPlan ? !!selectedPlanId : !!customAmount && Number(customAmount) > 0
  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t('generateFeesTitle')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 3</p>
          </div>
          <button
            onClick={requestClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1 — Fee source */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-sm font-semibold">
                <button
                  onClick={() => {
                    setUseExistingPlan(true)
                    markDirty()
                  }}
                  className={`flex-1 py-2.5 transition-colors ${useExistingPlan ? 'bg-kinder-orange text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  {t('useFeePlan')}
                </button>
                <button
                  onClick={() => {
                    setUseExistingPlan(false)
                    markDirty()
                  }}
                  className={`flex-1 py-2.5 transition-colors border-l border-gray-200 dark:border-gray-700 ${!useExistingPlan ? 'bg-kinder-orange text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  {t('customFee')}
                </button>
              </div>

              {useExistingPlan ? (
                <div>
                  <label className={labelCls}>{t('selectPlan')}</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => {
                      setSelectedPlanId(e.target.value)
                      markDirty()
                    }}
                    className={inputCls}
                  >
                    <option value="">{t('selectPlan')}</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — RM {Number(p.amount).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>{t('feeType')}</label>
                    <select
                      value={customType}
                      onChange={(e) => {
                        setCustomType(e.target.value as typeof customType)
                        markDirty()
                      }}
                      className={inputCls}
                    >
                      {FEE_TYPES.map((tp) => (
                        <option key={tp} value={tp}>
                          {typeLabel(tp)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('feeAmount')} *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value)
                        markDirty()
                      }}
                      placeholder="0.00"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t('feeDesc')}</label>
                    <input
                      type="text"
                      value={customDescription}
                      onChange={(e) => {
                        setCustomDescription(e.target.value)
                        markDirty()
                      }}
                      placeholder="e.g. January 2026 Tuition"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Target + due date */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>{t('targetClass')}</label>
                <select
                  value={targetClass}
                  onChange={(e) => {
                    setTargetClass(e.target.value)
                    markDirty()
                  }}
                  className={inputCls}
                >
                  <option value="all">{t('allStudents')}</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('dueDate')}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value)
                    markDirty()
                  }}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4 border border-orange-100 dark:border-orange-900/40 space-y-2 text-sm">
                <p className="font-bold text-gray-900 dark:text-gray-100">Summary</p>
                {useExistingPlan && selectedPlan ? (
                  <>
                    <p className="text-gray-600 dark:text-gray-400">
                      Plan:{' '}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {selectedPlan.name}
                      </span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Amount:{' '}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        RM {Number(selectedPlan.amount).toFixed(2)}
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 dark:text-gray-400">
                      Type:{' '}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {typeLabel(customType)}
                      </span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Amount:{' '}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        RM {Number(customAmount).toFixed(2)}
                      </span>
                    </p>
                  </>
                )}
                <p className="text-gray-600 dark:text-gray-400">
                  Target:{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {targetClass === 'all' ? t('allStudents') : targetClass}
                  </span>
                </p>
                {dueDate && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Due:{' '}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {dueDate}
                    </span>
                  </p>
                )}
                {previewCount !== null && (
                  <p className="text-kinder-orange font-bold mt-2">
                    {t('generatePreview').replace('{n}', String(previewCount))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <button
                disabled={step === 1 && !canGoStep2}
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                className="flex items-center gap-1.5 bg-kinder-orange text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-orange-600 transition-colors"
              >
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="bg-kinder-orange text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-orange-600 transition-colors"
              >
                {mutation.isPending ? t('generating') : t('confirmGenerate')}
              </button>
            )}
          </div>
        </div>
      </div>
      <DiscardDialog show={showConfirm} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  )
}
