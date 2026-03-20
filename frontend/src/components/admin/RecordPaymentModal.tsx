import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Receipt, AlertTriangle, Upload, Loader, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { feesApi, documentNumberingApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { useT } from '@/hooks/useT'
import type { FeeRecord } from '@/types'
import { useDiscardGuard } from '@/hooks/useDiscardGuard'
import { useSignedUrl } from '@/hooks/useSignedUrl'
import { DiscardDialog } from '@/components/ui/DiscardDialog'

interface Props {
  record: FeeRecord
  onClose: () => void
  onPaymentDone: (updatedRecord: FeeRecord & { this_payment: number }) => void
}

export function RecordPaymentModal({ record, onClose, onPaymentDone }: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard } =
    useDiscardGuard(onClose)

  const { data: numberingData, isLoading: numberingLoading } = useQuery({
    queryKey: ['document-numbering', 'receipt'],
    queryFn: () => documentNumberingApi.get('receipt'),
    staleTime: 60_000,
  })

  const numberingConfigured = !numberingLoading && !!numberingData?.data

  const balance =
    Number(record.amount_owed) - Number(record.discount_amount) - Number(record.amount_paid)
  const [amount, setAmount] = useState(balance.toFixed(2))
  const [error, setError] = useState('')
  const [proofUrl, setProofUrl] = useState(record.payment_proof_url ?? '')
  const [uploading, setUploading] = useState(false)
  const proofDisplayUrl = useSignedUrl('payment-proofs', proofUrl || null)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAmount(balance.toFixed(2))
    setProofUrl(record.payment_proof_url ?? '')
    setError('')
    setUploadError('')
    resetDirty()
  }, [record.id])

  const mutation = useMutation({
    mutationFn: () =>
      feesApi.recordPayment(record.id, {
        amount: Number(amount),
        payment_proof_url: proofUrl || null,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fees'] })
      toast.success(t('paymentSuccess'))
      onPaymentDone(data)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to record payment. Please try again.'
      toast.error(msg)
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploading(true)

    const ext = file.type === 'application/pdf' ? 'pdf' : (file.name.split('.').pop() ?? 'jpg')
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('payment-proofs')
      .upload(path, file, { upsert: false })

    if (storageError) {
      setUploadError(t('uploadFailed'))
      setUploading(false)
      return
    }

    // Store the path (not public URL) — bucket is private, we use signed URLs to display
    setProofUrl(path)
    markDirty()
    setUploading(false)
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const n = Number(amount)
    if (!n || n <= 0) {
      setError(t('required'))
      return
    }
    if (n > balance + 0.01) {
      setError(`Maximum payment is RM ${balance.toFixed(2)}`)
      return
    }
    setError('')
    mutation.mutate()
  }

  const formatRM = (v: number | string) => `RM ${Number(v).toFixed(2)}`

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-kinder-orange/30 focus:border-kinder-orange transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Receipt size={17} className="text-kinder-orange" />
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t('recordPaymentTitle')}
            </h2>
          </div>
          <button
            onClick={requestClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Numbering not configured warning */}
          {!numberingLoading && !numberingConfigured && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-5">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">{t('noNumberingSetup')}</p>
            </div>
          )}

          {/* Student + description */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 mb-5">
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
              {record.students?.full_name ?? 'Student'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{record.description}</p>
          </div>

          {/* Balance breakdown */}
          <div className="space-y-2 mb-5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('totalOwed')}</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatRM(record.amount_owed)}
              </span>
            </div>
            {Number(record.discount_amount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('feeDiscount')}</span>
                <span className="font-semibold text-green-600">
                  -{formatRM(record.discount_amount)}
                </span>
              </div>
            )}
            {Number(record.amount_paid) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('totalPaid')}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatRM(record.amount_paid)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {t('balanceRemaining')}
              </span>
              <span className="font-extrabold text-kinder-orange">{formatRM(balance)}</span>
            </div>
          </div>

          {/* Payment input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('paymentAmount')} *
              </label>
              <input
                type="number"
                min="0.01"
                max={balance}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  markDirty()
                }}
                className={inputCls}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            {/* Payment proof upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('attachPaymentProof')}
              </label>

              {/* Preview: image */}
              {proofUrl && !proofUrl.toLowerCase().endsWith('.pdf') && proofDisplayUrl && (
                <div className="mb-2 w-full h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <img
                    src={proofDisplayUrl}
                    alt={t('paymentProof')}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}

              {/* Preview: PDF */}
              {proofUrl && proofUrl.toLowerCase().endsWith('.pdf') && proofDisplayUrl && (
                <div className="mb-2 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  <FileText size={15} className="text-kinder-orange flex-shrink-0" />
                  <span className="flex-1 truncate">{t('pdfAttached')}</span>
                  <a
                    href={proofDisplayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-kinder-orange hover:underline flex-shrink-0"
                  >
                    {t('viewProof')}
                  </a>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-kinder-orange hover:text-kinder-orange dark:hover:border-kinder-orange dark:hover:text-kinder-orange transition-all disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    {t('uploading')}
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    {proofUrl ? t('changePhoto') : t('uploadProof')}
                  </>
                )}
              </button>

              {proofUrl && !uploading && (
                <button
                  type="button"
                  onClick={() => {
                    setProofUrl('')
                    markDirty()
                  }}
                  className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors w-full text-center"
                >
                  {t('removePhoto')}
                </button>
              )}

              {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={requestClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || !numberingConfigured || uploading}
                className="flex-1 bg-kinder-orange text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-orange-600 transition-colors"
              >
                {mutation.isPending ? t('saving2') : t('recordPayment')}
              </button>
            </div>
          </form>
        </div>
      </div>
      <DiscardDialog show={showConfirm} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  )
}
